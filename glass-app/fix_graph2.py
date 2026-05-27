with open('adhd.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Replace direction labels with arrow symbols in calcDesnivel_wall
data = data.replace(
    "const dir = diff > 0 ? 'ADENTRO' : 'AFUERA';",
    "const arrow = diff > 0 ? '⟨' : '⟩';"
)
data = data.replace(
    "label: toFracStr(val) + \" \"+ dir, raw: diff",
    "label: arrow + ' ' + toFracStr(val), raw: diff"
)

# Move wall arrow Y from 30% to 50% (middle of edge, away from dim lines)
data = data.replace(
    "arrowY = levelP1.y + (levelP2.y - levelP1.y) * 0.3; // arrow near top",
    "arrowY = levelP1.y + (levelP2.y - levelP1.y) * 0.5; // arrow at mid"
)

with open('adhd.js', 'w', encoding='utf-8') as f:
    f.write(data)
print("Done!")
