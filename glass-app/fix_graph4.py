import os
os.chdir(r'C:\Users\bnjlebron\nivelato\glass-app')
with open('adhd.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Show exact text around calcDesnivel_wall
idx = data.find('function calcDesnivel_wall')
if idx >= 0:
    print("WALL FUNCTION:")
    print(repr(data[idx:idx+350]))
else:
    print("calcDesnivel_wall NOT FOUND!")

idx2 = data.find('function calcDesnivel_horiz')
if idx2 >= 0:
    print("HORIZ FUNCTION:")
    print(repr(data[idx2:idx2+350]))
else:
    print("calcDesnivel_horiz NOT FOUND!")
