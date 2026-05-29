import fs from 'fs';
for (const f of ['dashboard.html', 'glass-app/dashboard.html']) {
  let h = fs.readFileSync(f, 'utf8');
  // fix orphan }; to }); where it closes a callback/arrow
  h = h.replace(/(\{[^}]*?);\n  };/g, '{$1});');
  fs.writeFileSync(f, h);
}
console.log('fixed');
