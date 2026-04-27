"""
mcp-iso-vm: MCP server for managing a persistent virtual Windows filesystem.
Provides Claude's virtual-machine-runner skill with cross-session persistence.

Includes:
- Virtual filesystem (fake C:\)
- Registry simulation (HKLM / HKCU as JSON)
- Hardware profile (hardcoded, no bluetooth, wifi via real adapter)
- vm_package: zips filesystem into a .ISO and drops it in Downloads
- Snapshot / restore
- Session log
"""

import json
import os
import shutil
import struct
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    raise ImportError("Install with: pip install fastmcp")

# ── config ────────────────────────────────────────────────────────────────────

VM_STATE_DIR = Path(os.environ.get("VM_STATE_DIR", Path.home() / "vm-state"))
FS_ROOT      = VM_STATE_DIR / "filesystem"
LOG_FILE     = VM_STATE_DIR / "vm-session-log.json"
SNAP_DIR     = VM_STATE_DIR / "snapshots"
REG_FILE     = VM_STATE_DIR / "registry.json"

for d in (VM_STATE_DIR, FS_ROOT, SNAP_DIR):
    d.mkdir(parents=True, exist_ok=True)

DOWNLOADS_DIR = Path.home() / "Downloads"
ISO_LABEL     = "THE_TISM"

# ── hardcoded hardware profile ────────────────────────────────────────────────

HARDWARE_PROFILE = {
    "cpu":    "Intel Core i5-10400 @ 2.90GHz",
    "ram":    "8192 MB DDR4",
    "disk":   "128 GB SSD (C:\\)",
    "gpu":    "Intel UHD Graphics 630",
    "ethernet": {
        "adapter": "Intel(R) Ethernet Connection (11) I219-V",
        "ipv4":    "192.168.1.42",
        "mask":    "255.255.255.0",
        "gateway": "192.168.1.1",
        "dns":     "8.8.8.8",
    },
    "wifi": {
        "note":    "WiFi adapter present — routes through host machine's real adapter via MCP bridge.",
        "adapter": "Intel(R) Wi-Fi 6 AX201",
        "ssid":    "[inherits from host]",
    },
    "bluetooth": None,
    "os":       "Windows 10 Enterprise LTSC 2021",
    "build":    "19044.5011",
    "hostname": "DESKTOP-T1SM420",
    "drive_label": ISO_LABEL,
}

# ── default registry ──────────────────────────────────────────────────────────

DEFAULT_REGISTRY = {
    "HKEY_LOCAL_MACHINE": {
        "SOFTWARE": {
            "Microsoft": {
                "Windows NT": {
                    "CurrentVersion": {
                        "ProductName":        "Windows 10 Enterprise LTSC 2021",
                        "CurrentBuild":       "19044",
                        "CurrentBuildNumber": "19044",
                        "DisplayVersion":     "21H2",
                        "RegisteredOwner":    "benj",
                        "InstallDate":        "2026-04-08",
                        "EditionID":          "EnterpriseS",
                    }
                },
                "Windows": {
                    "CurrentVersion": {
                        "ProgramFilesDir":        "C:\\Program Files",
                        "ProgramFilesDir (x86)":  "C:\\Program Files (x86)",
                        "CommonFilesDir":          "C:\\Program Files\\Common Files",
                    }
                }
            },
            "Policies": {
                "Microsoft": {
                    "Windows": {
                        "WindowsUpdate": {
                            "AU": {
                                "NoAutoUpdate": 0,
                                "AUOptions":    3,
                            }
                        }
                    }
                }
            }
        },
        "SYSTEM": {
            "CurrentControlSet": {
                "Control": {
                    "ComputerName": {
                        "ComputerName": HARDWARE_PROFILE["hostname"]
                    },
                    "TimeZoneInformation": {
                        "TimeZoneKeyName": "Atlantic Standard Time"
                    }
                },
                "Services": {
                    "WinDefend": {"Start": 2, "Type": 32},
                    "wuauserv":  {"Start": 3, "Type": 32},
                    "Bluetooth": {"Start": 4, "Type": 32,
                                  "_note": "disabled — no adapter present"},
                    "WlanSvc":   {"Start": 2, "Type": 32,
                                  "_note": "active — routes via host adapter"},
                }
            }
        },
        "HARDWARE": {
            "DESCRIPTION": {
                "System": {
                    "CentralProcessor": {
                        "0": {
                            "ProcessorNameString": HARDWARE_PROFILE["cpu"],
                            "VendorIdentifier":    "GenuineIntel",
                            "MHz":                 2900,
                        }
                    }
                }
            }
        }
    },
    "HKEY_CURRENT_USER": {
        "SOFTWARE": {
            "Microsoft": {
                "Windows": {
                    "CurrentVersion": {
                        "Explorer": {
                            "Advanced": {
                                "Hidden":          1,
                                "HideFileExt":     0,
                                "ShowSuperHidden": 1,
                            }
                        },
                        "Themes": {
                            "Personalize": {
                                "AppsUseLightTheme":    0,
                                "SystemUsesLightTheme": 0,
                            }
                        }
                    }
                },
                "Edge": {
                    "Main": {
                        "DefaultBrowser": 1,
                        "_note": "edge is the default. user will hate this. accurate.",
                    }
                }
            }
        },
        "Control Panel": {
            "Accessibility": {
                "StickyKeys": {"Flags": "506"},
            },
            "Desktop": {
                "Wallpaper": "C:\\Windows\\Web\\Wallpaper\\Windows\\img0.jpg"
            }
        }
    }
}

# ── helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _safe_path(virtual_path: str) -> Path:
    p = virtual_path.replace("\\", "/")
    if len(p) >= 2 and p[1] == ":":
        p = p[2:]
    p = p.lstrip("/")
    resolved = (FS_ROOT / p).resolve()
    if not str(resolved).startswith(str(FS_ROOT)):
        raise ValueError(f"Path escape attempt: {virtual_path}")
    return resolved

def _read_log() -> list:
    if LOG_FILE.exists():
        try:
            return json.loads(LOG_FILE.read_text())
        except Exception:
            return []
    return []

def _append_log(entry: dict):
    log = _read_log()
    log.append({"ts": _now(), **entry})
    LOG_FILE.write_text(json.dumps(log[-200:], indent=2))

def _vm_summary() -> dict:
    files = [str(p.relative_to(FS_ROOT)) for p in FS_ROOT.rglob("*") if p.is_file()]
    return {"file_count": len(files), "files": files[:50]}

def _read_registry() -> dict:
    if REG_FILE.exists():
        try:
            return json.loads(REG_FILE.read_text())
        except Exception:
            pass
    REG_FILE.write_text(json.dumps(DEFAULT_REGISTRY, indent=2))
    return DEFAULT_REGISTRY

def _write_registry(reg: dict):
    REG_FILE.write_text(json.dumps(reg, indent=2))

# ── ISO builder (pure python, no deps) ───────────────────────────────────────

def _build_iso(source_dir: Path, output_path: Path, label: str = "THE_TISM"):
    SECTOR = 2048

    def pad(data: bytes, size: int) -> bytes:
        return data[:size].ljust(size, b'\x00')

    def both32(n: int) -> bytes:
        return struct.pack('<I', n) + struct.pack('>I', n)

    def both16(n: int) -> bytes:
        return struct.pack('<H', n) + struct.pack('>H', n)

    def iso_date(dt: datetime) -> bytes:
        return bytes([dt.year - 1900, dt.month, dt.day,
                      dt.hour, dt.minute, dt.second, 0])

    def iso_str(s: str, length: int) -> bytes:
        return s.upper().encode('ascii', errors='replace')[:length].ljust(length, b' ')

    now = datetime.now()

    files = [(p.relative_to(source_dir), p)
             for p in sorted(source_dir.rglob('*')) if p.is_file()]

    root_dir_sector  = 18
    file_start_sector = 19

    extents = []
    cur = file_start_sector
    for rel, abs_path in files:
        size = abs_path.stat().st_size
        extents.append((rel, abs_path, cur, size))
        cur += max(1, (size + SECTOR - 1) // SECTOR)

    def dir_record(name: bytes, extent: int, size: int, is_dir: bool = False) -> bytes:
        flags    = 0x02 if is_dir else 0x00
        name_f   = name if name else b'\x00'
        name_len = len(name_f)
        rec_len  = 33 + name_len
        if rec_len % 2:
            rec_len += 1
        rec = bytes([rec_len, 0]) + both32(extent) + both32(size)
        rec += iso_date(now) + bytes([flags, 0, 0]) + both16(1)
        rec += bytes([name_len]) + name_f
        return rec.ljust(rec_len, b'\x00')

    dot       = dir_record(b'\x00', root_dir_sector, SECTOR, True)
    dotdot    = dir_record(b'\x01', root_dir_sector, SECTOR, True)
    file_recs = b''
    for rel, abs_path, extent, size in extents:
        safe = str(rel).replace('\\', '_').replace('/', '_').upper()
        file_recs += dir_record(safe.encode('ascii', errors='replace')[:30], extent, size)

    root_dir_data = pad(dot + dotdot + file_recs, SECTOR)

    pvd = bytearray(SECTOR)
    pvd[0]      = 1
    pvd[1:6]    = b'CD001'
    pvd[6]      = 1
    pvd[8:40]   = iso_str(label, 32)
    pvd[40:72]  = iso_str(label, 32)
    struct.pack_into('<I', pvd, 80, cur)
    struct.pack_into('>I', pvd, 84, cur)
    pvd[120:122] = both16(1)[:2]
    pvd[124:126] = both16(1)[:2]
    pvd[128:130] = both16(SECTOR)[:2]
    pvd[132:140] = both32(0)
    pvd[156:190] = pad(dot, 34)
    pvd[574:702] = iso_str('MCP-ISO-VM', 128)
    pvd[882]     = 1

    vdst      = bytearray(SECTOR)
    vdst[0]   = 255
    vdst[1:6] = b'CD001'
    vdst[6]   = 1

    with open(output_path, 'wb') as f:
        f.write(b'\x00' * (16 * SECTOR))
        f.write(bytes(pvd))
        f.write(bytes(vdst))
        f.write(root_dir_data)
        for _, abs_path, _, size in extents:
            data    = abs_path.read_bytes()
            sectors = max(1, (size + SECTOR - 1) // SECTOR)
            f.write(pad(data, sectors * SECTOR))

# ── MCP server ────────────────────────────────────────────────────────────────

mcp = FastMCP("mcp-iso-vm")

@mcp.tool()
def vm_status() -> str:
    """Get current VM filesystem status, hardware profile, and recent session log."""
    log     = _read_log()
    summary = _vm_summary()
    return json.dumps({
        "vm_state_dir":    str(VM_STATE_DIR),
        "filesystem_root": str(FS_ROOT),
        "file_count":      summary["file_count"],
        "hardware":        HARDWARE_PROFILE,
        "recent_log":      log[-10:],
    }, indent=2)

@mcp.tool()
def vm_hardware_profile() -> str:
    """Get the hardcoded hardware profile for this VM instance (CPU, RAM, network, no bluetooth)."""
    return json.dumps(HARDWARE_PROFILE, indent=2)

@mcp.tool()
def vm_read_file(virtual_path: str) -> str:
    """Read a file from the virtual Windows filesystem. virtual_path: Windows-style e.g. C:\\Users\\benj\\notes.txt"""
    real = _safe_path(virtual_path)
    if not real.exists():
        return f"ERROR: File not found: {virtual_path}"
    if not real.is_file():
        return f"ERROR: Not a file: {virtual_path}"
    try:
        content = real.read_text(encoding="utf-8", errors="replace")
        _append_log({"action": "read_file", "path": virtual_path})
        return content
    except Exception as e:
        return f"ERROR reading {virtual_path}: {e}"

@mcp.tool()
def vm_write_file(virtual_path: str, content: str) -> str:
    """Write content to a file in the virtual Windows filesystem. Creates directories as needed."""
    real = _safe_path(virtual_path)
    real.parent.mkdir(parents=True, exist_ok=True)
    real.write_text(content, encoding="utf-8")
    _append_log({"action": "write_file", "path": virtual_path, "size": len(content)})
    return f"Written: {virtual_path} ({len(content)} chars)"

@mcp.tool()
def vm_delete_file(virtual_path: str) -> str:
    """Delete a file or directory from the virtual filesystem."""
    real = _safe_path(virtual_path)
    if not real.exists():
        return f"ERROR: Not found: {virtual_path}"
    if real.is_dir():
        shutil.rmtree(real)
        _append_log({"action": "delete_dir", "path": virtual_path})
        return f"Deleted directory: {virtual_path}"
    real.unlink()
    _append_log({"action": "delete_file", "path": virtual_path})
    return f"Deleted: {virtual_path}"

@mcp.tool()
def vm_list_dir(virtual_path: str = "C:\\") -> str:
    """List contents of a directory in the virtual filesystem."""
    real = _safe_path(virtual_path)
    if not real.exists():
        return f"ERROR: Directory not found: {virtual_path}"
    if not real.is_dir():
        return f"ERROR: Not a directory: {virtual_path}"
    entries = []
    for item in sorted(real.iterdir()):
        kind = "<DIR>" if item.is_dir() else f"{item.stat().st_size:>10} bytes"
        entries.append(f"  {kind}  {item.name}")
    _append_log({"action": "list_dir", "path": virtual_path})
    return (f"Directory of {virtual_path}\n\n" + "\n".join(entries)) if entries else "(empty)"

@mcp.tool()
def vm_reg_read(key_path: str, value_name: str = "") -> str:
    """
    Read from the Windows registry simulation.
    key_path: e.g. HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion
    value_name: specific value name, or empty to dump the whole key
    """
    reg  = _read_registry()
    node = reg
    for part in key_path.replace("/", "\\").split("\\"):
        if part not in node:
            return f"ERROR: Registry key not found: {key_path}"
        node = node[part]
    if value_name:
        if value_name not in node:
            return f"ERROR: Value '{value_name}' not found in {key_path}"
        return json.dumps({value_name: node[value_name]}, indent=2)
    _append_log({"action": "reg_read", "key": key_path})
    return json.dumps(node, indent=2)

@mcp.tool()
def vm_reg_write(key_path: str, value_name: str, value: str, value_type: str = "REG_SZ") -> str:
    """
    Write a value to the Windows registry simulation.
    value_type: REG_SZ | REG_DWORD | REG_BINARY | REG_EXPAND_SZ
    """
    reg  = _read_registry()
    node = reg
    for part in key_path.replace("/", "\\").split("\\"):
        if part not in node:
            node[part] = {}
        node = node[part]

    coerced: Any = value
    if value_type == "REG_DWORD":
        try:
            coerced = int(value)
        except ValueError:
            return f"ERROR: REG_DWORD requires integer value, got: {value}"

    node[value_name] = coerced
    _write_registry(reg)
    _append_log({"action": "reg_write", "key": key_path, "value": value_name, "type": value_type})
    return f"Registry updated: {key_path}\\{value_name} = {coerced} ({value_type})"

@mcp.tool()
def vm_reg_delete(key_path: str, value_name: str = "") -> str:
    """
    Delete a registry key or specific value.
    If value_name is empty, deletes the entire key.
    """
    reg   = _read_registry()
    parts = key_path.replace("/", "\\").split("\\")
    node  = reg
    for part in parts[:-1]:
        if part not in node:
            return f"ERROR: Key not found: {key_path}"
        node = node[part]
    last = parts[-1]
    if value_name:
        if last not in node or value_name not in node[last]:
            return f"ERROR: Value '{value_name}' not found"
        del node[last][value_name]
    else:
        if last not in node:
            return f"ERROR: Key not found: {key_path}"
        del node[last]
    _write_registry(reg)
    _append_log({"action": "reg_delete", "key": key_path, "value": value_name or "(key)"})
    return f"Deleted: {key_path}" + (f"\\{value_name}" if value_name else "")

@mcp.tool()
def vm_reg_reset() -> str:
    """Reset the registry to factory defaults. Use after catastrophic user decisions."""
    _write_registry(DEFAULT_REGISTRY)
    _append_log({"action": "reg_reset"})
    return "Registry reset to defaults. windows is freshly traumatized."

@mcp.tool()
def vm_package() -> str:
    """
    Package the entire virtual filesystem into an ISO image.
    Drive label: THE_TISM
    Drops the .iso into ~/Downloads/THE_TISM.iso
    """
    output_path = DOWNLOADS_DIR / "THE_TISM.iso"
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

    file_count = sum(1 for p in FS_ROOT.rglob("*") if p.is_file())
    if file_count == 0:
        placeholder = FS_ROOT / "README.TXT"
        placeholder.write_text(
            "THE_TISM virtual filesystem\r\n"
            "Packaged by mcp-iso-vm\r\n"
            f"Drive label: {ISO_LABEL}\r\n"
            f"Packed: {_now()}\r\n"
        )
        file_count = 1

    _build_iso(FS_ROOT, output_path, label=ISO_LABEL)
    size_mb = output_path.stat().st_size / (1024 * 1024)
    _append_log({"action": "vm_package", "output": str(output_path), "size_mb": round(size_mb, 2)})
    return (
        f"ISO packaged: {output_path}\n"
        f"Drive label:  {ISO_LABEL}\n"
        f"Size:         {size_mb:.2f} MB\n"
        f"Files:        {file_count}"
    )

@mcp.tool()
def vm_save_session_summary(summary: str, session_id: str = "") -> str:
    """Save a session summary each turn so future Claude instances can resume."""
    _append_log({
        "action":     "session_summary",
        "session_id": session_id or "unknown",
        "summary":    summary,
        "vm_state":   _vm_summary(),
    })
    return f"Session summary saved at {_now()}"

@mcp.tool()
def vm_snapshot(snapshot_name: str) -> str:
    """Take a snapshot of the current virtual filesystem state."""
    snap_path = SNAP_DIR / snapshot_name
    if snap_path.exists():
        shutil.rmtree(snap_path)
    shutil.copytree(FS_ROOT, snap_path)
    _append_log({"action": "snapshot", "name": snapshot_name})
    return f"Snapshot '{snapshot_name}' saved."

@mcp.tool()
def vm_restore_snapshot(snapshot_name: str) -> str:
    """Restore the virtual filesystem from a named snapshot."""
    snap_path = SNAP_DIR / snapshot_name
    if not snap_path.exists():
        available = [s.name for s in SNAP_DIR.iterdir() if s.is_dir()]
        return f"ERROR: Snapshot '{snapshot_name}' not found. Available: {available}"
    shutil.rmtree(FS_ROOT)
    shutil.copytree(snap_path, FS_ROOT)
    _append_log({"action": "restore_snapshot", "name": snapshot_name})
    return f"Restored snapshot '{snapshot_name}'."

@mcp.tool()
def vm_list_snapshots() -> str:
    """List all available VM snapshots."""
    snaps = [s.name for s in SNAP_DIR.iterdir() if s.is_dir()]
    if not snaps:
        return "No snapshots found."
    return "Available snapshots:\n" + "\n".join(f"  • {s}" for s in sorted(snaps))

@mcp.tool()
def vm_get_session_log(last_n: int = 20) -> str:
    """Get the last N entries from the VM session log."""
    log = _read_log()
    return json.dumps(log[-last_n:], indent=2)

if __name__ == "__main__":
    mcp.run()
