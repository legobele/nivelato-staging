import fs from 'fs';
for (const f of ['dashboard.html', 'glass-app/dashboard.html']) {
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace('    };\n    const low =', '    });\n    const low =');
  fs.writeFileSync(f, h);
}
console.log('fixed');
