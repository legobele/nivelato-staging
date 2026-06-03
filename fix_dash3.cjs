const fs = require('fs');
const files = ['dashboard.html', 'glass-app/dashboard.html'];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(
    'document.getElementById("dash-loading").textContent = "Conectando..."; setTimeout(() => { if (typeof onAuthStateChanged === "undefined") window.location.href = "./index.html"; }, 3000);',
    'const dl = document.querySelector(".loading"); if(dl) dl.textContent = "Conectando..."; setTimeout(() => { if (typeof onAuthStateChanged === "undefined") window.location.href = "./index.html"; }, 3000);'
  );
  fs.writeFileSync(f, c);
  console.log('FIXED', f);
}
