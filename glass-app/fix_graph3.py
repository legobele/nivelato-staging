with open('adhd.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Fix calcDesnivel_wall to use arrow in label
data = data.replace(
    "  const arrow = diff > 0 ? '\u27e8' : '\u27e9';\n  return { val: val, dir: dir, label: arrow + ' ' + toFracStr(val), raw: diff };",
    "  const dir = diff > 0 ? '\u27e8' : '\u27e9';\n  return { val: val, dir: dir, label: dir + ' ' + toFracStr(val), raw: diff };"
)

# Fix calcDesnivel_horiz to use arrow symbols and flip for right-side basis
old_horiz = '''  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'Nivel', raw: 0 };
  const val = Math.abs(diff);
  // diff > 0: left is further from laser = left is LOWER = offset is DOWN on left
  // diff < 0: right is further from laser = right is LOWER = offset is DOWN on right = UP on left
  const leftIsLower = diff > 0;
  const dir = leftIsLower ? 'ABAJO' : 'ARRIBA';
  return { val: val, dir: dir, label: arrow + ' ' + toFracStr(val), raw: diff };'''

new_horiz = '''  const diff = a - b;
  if (Math.abs(diff) < 0.001) return { val: 0, dir: 'NIVEL', label: 'Nivel', raw: 0 };
  const val = Math.abs(diff);
  // offset on RIGHT side: diff>0 = right side higher = arrow up, diff<0 = right lower = arrow down
  const dir = diff > 0 ? '\u2191' : '\u2193';
  return { val: val, dir: dir, label: dir + ' ' + toFracStr(val), raw: diff };'''

if old_horiz in data:
    data = data.replace(old_horiz, new_horiz)
    with open('adhd.js', 'w', encoding='utf-8') as f:
        f.write(data)
    print("Horizontal fixed!")
else:
    print("HORIZ NOT FOUND!")
    # Show the actual text
    idx = data.find('calcDesnivel_horiz')
    if idx >= 0:
        print(repr(data[idx:idx+350]))
