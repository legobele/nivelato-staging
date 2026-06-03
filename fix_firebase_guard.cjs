const fs = require('fs');
const files = ['dashboard.html', 'glass-app/dashboard.html'];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(
    '  if (typeof onAuthStateChanged === "undefined") { const dl = document.querySelector(".loading"); if(dl) dl.textContent = "Conectando..."; setTimeout(() => { if (typeof onAuthStateChanged === "undefined") window.location.href = "./index.html"; }, 3000); }\n  onAuthStateChanged(auth, async (user) => {',
    '  if (typeof onAuthStateChanged === "undefined") { const dl = document.querySelector(".loading"); if(dl) dl.textContent = "Conectando..."; setTimeout(() => { if (typeof onAuthStateChanged === "undefined") window.location.href = "./index.html"; }, 3000); return; }\n  onAuthStateChanged(auth, async (user) => {'
  );
  fs.writeFileSync(f, c);
  console.log('FIXED', f);
}
