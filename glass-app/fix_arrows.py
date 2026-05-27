import os, sys
os.chdir(r'C:\Users\bnjlebron\nivelato\glass-app')

with open('adhd.js', 'rb') as f:
    data = f.read()

# Fix wall function: const arrow -> const dir (so return works)
data = data.replace(
    b'const arrow = diff > 0 ? \xe2\x9f\xa8\' : \'\xe2\x9f\xa9\';',
    b"const dir = diff > 0 ? '\xe2\x9f\xa8' : '\xe2\x9f\xa9';"
)

# Fix horiz function: replace ABAJO/ARRIBA with arrow symbols
old_horiz = (b"  const val = Math.abs(diff);\n"
             b"  // diff > 0: left is further from laser = left is LOWER = offset is DOWN on left\n"
             b"  // diff < 0: right is further from laser = right is LOWER = offset is DOWN on right = UP on left\n"
             b"  const leftIsLower = diff > 0;\n"
             b"  const dir = leftIsLower ? 'ABAJO' : 'ARRIBA';\n"
             b"  return { val: val, dir: dir, label: arrow + ' ' + toFracStr(val), raw: diff };")

new_horiz = (b"  const val = Math.abs(diff);\n"
             b"  // offset on RIGHT side: diff>0 = right higher = \xe2\x86\x91, diff<0 = right lower = \xe2\x86\x93\n"
             b"  const dir = diff > 0 ? '\xe2\x86\x91' : '\xe2\x86\x93';\n"
             b"  return { val: val, dir: dir, label: dir + ' ' + toFracStr(val), raw: diff };")

if old_horiz in data:
    data = data.replace(old_horiz, new_horiz)
    with open('adhd.js', 'wb') as f:
        f.write(data)
    print("Fixed!")
else:
    print("HORIZ BLOCK NOT FOUND!")
    idx = data.find(b'ABAJO')
    print(f"ABAJO at {idx}")
    if idx >= 0:
        print(data[idx:idx+120])
