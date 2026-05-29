const fs = require('fs');
for (const f of ['dashboard.html', 'glass-app/dashboard.html']) {
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace('(p) || 0;\n    };\n    const low', '(p) || 0;\n    });\n    const low');
  fs.writeFileSync(f, h);
  console.log('fixed', f);
}
