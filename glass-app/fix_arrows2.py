import os
os.chdir(r'C:\Users\bnjlebron\nivelato\glass-app')

with open('adhd.js', 'rb') as f:
    data = f.read()

old_horiz = (b"  const val = Math.abs(diff);\r\n"
             b"  // diff > 0: left is further from laser = left is LOWER = offset is DOWN on left\r\n"
             b"  // diff < 0: right is further from laser = right is LOWER = offset is DOWN on right = UP on left\r\n"
             b"  const leftIsLower = diff > 0;\r\n"
             b"  const dir = leftIsLower ? 'ABAJO' : 'ARRIBA';\r\n"
             b"  return { val: val, dir: dir, label: arrow + ' ' + toFracStr(val), raw: diff };")

new_horiz = (b"  const val = Math.abs(diff);\r\n"
             b"  // offset on RIGHT side: diff>0 = right higher = \xe2\x86\x91, diff<0 = right lower = \xe2\x86\x93\r\n"
             b"  const dir = diff > 0 ? '\xe2\x86\x91' : '\xe2\x86\x93';\r\n"
             b"  return { val: val, dir: dir, label: dir + ' ' + toFracStr(val), raw: diff };")

if old_horiz in data:
    data = data.replace(old_horiz, new_horiz)
    with open('adhd.js', 'wb') as f:
        f.write(data)
    print("Fixed!")
else:
    print("STILL NOT FOUND!")
    # Show exact bytes
    idx = data.find(b'ABAJO')
    print(f"ABAJO at {idx}")
    # Show surrounding bytes
    start = data.rfind(b'var val', 0, idx)
    end = data.find(b'recalcAll', idx)
    print(repr(data[start:end]))
