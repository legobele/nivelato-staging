const fs = require('fs');
const path = require('path');

// Fix index.html
let c = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
c = c.replace('</body>', '<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("/nivelato/sw.js")}</script></body>');
fs.writeFileSync(path.join(__dirname, 'index.html'), c);
console.log('index.html done');

// Fix glass-app/index.html
let g = fs.readFileSync(path.join(__dirname, 'glass-app', 'index.html'), 'utf8');
g = g.replace('</body>', '<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("/nivelato/sw.js")}</script></body>');
fs.writeFileSync(path.join(__dirname, 'glass-app', 'index.html'), g);
console.log('glass-app done');

// Copy manifest + sw to glass-app too
fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(__dirname, 'glass-app', 'manifest.json'));
fs.copyFileSync(path.join(__dirname, 'sw.js'), path.join(__dirname, 'glass-app', 'sw.js'));
console.log('copied to glass-app');
