const fs = require('fs');
const files = ['adhd.js', 'glass-app/adhd.js'];
const arrR = '\u27e9'; // ⟩
const arrL = '\u27e8'; // ⟨

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  // Remove the right-wall mirror block
  // Match: comment line + if/else block
  const mirrorRe = /  \/\/ Mirror right wall arrow \(opposite reference frame\)\n  if \(results\.paredDer\.dir === .\) results\.paredDer\.dir = .;\n  else if \(results\.paredDer\.dir === .\) results\.paredDer\.dir = .;\n/g;
  c = c.replace(mirrorRe, '');

  // Fix the base function arrow mapping: swap ⟩ and ⟨
  c = c.replace('const arrow = diff > 0 ? ' + arrR + ' : ' + arrL + ';',
                'const arrow = diff > 0 ? ' + arrL + ' : ' + arrR + ';');
  fs.writeFileSync(f, c);
  console.log('FIXED', f);
}
