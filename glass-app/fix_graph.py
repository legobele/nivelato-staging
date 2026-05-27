import re

with open('adhd.js', 'r', encoding='utf-8') as f:
    data = f.read()

# 1. Flip ceiling/floor to right-side basis
old = '''  // Ceiling desnivel: t_A vs t_B
  // If t_A > t_B: left is further = left side is LOWER = right side is HIGHER
  // The rough opening ceiling slopes down to the right
  const topOffsetLeft  = clamp(((t_A - t_B) / tMax) * EXAG * (gr.h / gr.w), EXAG);
  const topOffsetRight = 0;

  // Floor desnivel: p_A vs p_B
  // If p_A > p_B: left is further = left side is LOWER = right side is HIGHER
  // The rough opening floor slopes up to the right
  const bottomOffsetLeft  = clamp(((p_A - p_B) / pMax) * EXAG * (gr.h / gr.w), EXAG);
  const bottomOffsetRight = 0;'''

new = '''  // Ceiling desnivel: t_A vs t_B — LEFT is 0,0, offset is on RIGHT
  const topOffsetLeft  = 0;
  const topOffsetRight = clamp(-((t_A - t_B) / tMax) * EXAG * (gr.h / gr.w), EXAG);

  // Floor desnivel: p_A vs p_B — LEFT is 0,0, offset is on RIGHT
  const bottomOffsetLeft  = 0;
  const bottomOffsetRight = clamp(-((p_A - p_B) / pMax) * EXAG * (gr.h / gr.w), EXAG);'''

count = data.count(old)
print(f"Found {count} match(es)")
if count > 0:
    data = data.replace(old, new)
    with open('adhd.js', 'w', encoding='utf-8') as f:
        f.write(data)
    print("Written!")
else:
    # Debug: show what's around line 551
    lines = data.split('\n')
    for i in range(548, 560):
        if i < len(lines):
            print(f"{i+1}: {lines[i]}")
