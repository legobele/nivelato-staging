import fs from 'fs';
for (const f of ['dashboard.html', 'glass-app/dashboard.html']) {
  let h = fs.readFileSync(f, 'utf8');
  let l = h.split('\n');
  let changes = 0;
  let out = [];
  for (let i = 0; i < l.length; i++) {
    let line = l[i];
    let prev = out.length > 0 ? out[out.length - 1] : '';
    // if line is just "  };" or "    };" and the previous line is not a control structure
    // (if/else/for/while/try/catch/switch) then it likely needs a ) before ;
    let trimmed = line.trimEnd();
    // Check: ends with }; but prev line doesn't end with { or ) (not a control structure)
    if (/^\s*\};$/.test(line) && prev.trim().endsWith(';')) {
      line = line.replace('};', '});');
      changes++;
    }
    out.push(line);
  }
  fs.writeFileSync(f, out.join('\n'));
  console.log(f + ': ' + changes + ' fixes');
}
