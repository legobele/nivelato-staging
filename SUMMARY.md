# Nivelato — Project Brief for External AIs
**Last updated:** April 28, 2026  
**Author:** Claub (Base44 Superagent) on behalf of Benj (legobele)

---

## Who is Benj?
- 14 years old, AuDHD, transfem (she/they), Puerto Rico
- Published researcher (ORCID: 0009-0008-9894-841X)
- Runs a snack business at school with an actual EULA
- Has been building software since before she could drive
- GitHub: legobele | Discord: legobele
- Timezone: America/La_Paz
- Uses emoticons, not emojis. Hates corporate AI behavior. Gen Z vibes-first energy.

---

## What is Nivelato?
A **professional glass measurement SaaS** built for Benj's family glass shop in Puerto Rico. It allows field technicians ("técnicos") to measure wall/ceiling/floor out-of-squareness ("descuadre" / "desniveles") and raw opening dimensions ("hueco") on-site, then share the data to the owner dashboard in real time.

**Live at:** https://legobele.github.io/nivelato/  
**Dashboard:** https://legobele.github.io/nivelato/dashboard.html  
**Stack:** Pure HTML/CSS/JS → GitHub Pages + Firebase (Auth + Firestore)

---

## Why it exists
Glass installation requires knowing:
1. The raw opening size (hueco) — width top & bottom, height left & right (can be trapezoidal)
2. How out-of-level each wall/ceiling/floor is (desniveles) — described as e.g. "3/8" afuera", "1/4" sube"

The final glass cut is determined by the specific frame/hardware system — the app does **not** auto-calculate cuts. It captures the raw data precisely and validates it, then the cotizador (quoting person) uses it with their own software (Logikal, A+W, etc.).

**Primary competitor:** MyMeasures (2014 app). Nivelato is the first tool purpose-built for Puerto Rican glass shop workflows.

---

## File naming convention (yes, really)
- `index.html` — main measurement tool
- `autism.css` — all styles
- `adhd.js` — all JS logic (measurement flow, Firestore save, share)
- `dashboard.html` — owner/supervisor dashboard
- `login.html` — auth (signup creates org, employee joins via join code)
- `auth-guard.js` — auth routing
- `firebase-config.js` — Firebase init
- `firestore.rules` — Firestore security rules

---

## Measurement Flow (5 steps)
1. **Técnico info** — name input
2. **Paredes** (walls) — Izquierda + Derecha desniveles (adentro/afuera + fraction)
3. **Techo/Piso** (ceiling/floor) — sube/baja + fraction
4. **Hueco** (opening) — ancho arriba, ancho abajo, alto izquierda, alto derecho
5. **Compartir** — generates summary text, saves to Firestore, shows skewed canvas diagram

---

## Validation Logic
Flags: `PAREDES NO CUADRAN`, `TECHO/PISO NO CUADRAN`, `FALTAN NIVELES DE TECHO`, `FALTA MEDIDA DEL HUECO`  
Warning block pulses red on error, green on OK. Warnings included in share text.

---

## Firebase / Auth Setup
- **Project:** nivelato-app (nam5 region)
- **Auth:** email + password only
- **Roles:** owner, measurer, supervisor, cotizador
- **Orgs:** each shop is an org. Owner creates org on signup, gets a 6-char join code (first 6 chars of Firebase UID). Employees join with code.
- **Firestore structure:** `orgs/{orgId}/jobs/{jobId}` — fully org-isolated, row-level security enforced
- **Domain restriction:** Firebase API keys restricted to `legobele.github.io/*`

---

## Dashboard Features
- Filter jobs by date, installer, warnings
- Tap job → wide modal with details panel (General / Hueco / Desniveles sections) + draggable/zoomable canvas
- Canvas renders skewed glass shape based on actual desnivel values with dimension lines and orange pill badges for each desnivel
- Owner can delete jobs
- Join code visible + copyable on dashboard

---

## Business Model
- **Family shop (founding client):** $75/mo flat for whole org (Mr. Lebron / dlebron@qgipr.com)
- **External clients:** $100 initial setup + $50/mo/user (min 2 users)
- **Pitch status:** Pitch emails sent in Spanish. Uncle is impressed. Mom wanted to pitch herself but Benj already emailed him lol. Demo-ready.
- **Goal:** Land uncle at $75/mo → fund Base44 Starter reactivation → scale to other PR glass shops → Builder plan → Pro plan

---

## Infrastructure (the chaos stack)
- **Hosting:** GitHub Pages (legobele/nivelato) — will migrate to Firebase Hosting
- **Agent platform:** Base44 Superagent (Claub) on Starter plan ($14/mo after student discount, cancelled May 26 2026 — will reactivate with uncle's first payment)
- **MCP:** Windows LTSC larp VM ("DESKTOP-T1SM420") running via GitHub Codespaces (4 core, 16GB RAM, Ubuntu 22.04). Accessible via ngrok.
- **Subagents:** 5 Cloudflare Workers (t1sm420-ops/research/creative/qc/strategy) hitting llama-server on Codespace running LFM2-VL-1.6B
- **Model:** LFM2-VL-1.6B Q4_K_M (~1.5GB, multimodal vision capable)
- **Virtual registry:** THE_TISM drive on Codespace
- **Cloudflare Account ID:** f340f909f4bd8d4751826debfa7cf2ac

---

## Notable Lore
- Entire SaaS built in ONE Monday on a $20 vanilla Visa giftcard that had been sitting since 2024
- File naming (autism.css / adhd.js) is intentional and permanent
- Mom is on a Microsoft Copilot/Excel arc. Nivelato is the answer.
- "The whole office has seen it. Expectations are high. No pressure lol."
- Benj bypassed Base44's Builder-tier features (GitHub sync, MCP, automations) via chaos engineering on the Starter/free plan. Base44 forgot to lock half their gates.
- The Firebase version collision bug (importing Firestore from v10.11.0 AND v10.12.2 simultaneously) has achieved lore status.
- Real test measurement: Derrick Champion order — espejo color bronce, 114 1/16" × ~47", techo sube 1/4" izq

---

## What's Left (priority order)
1. Lock down Firestore rules properly before prod
2. Pitch PDF leave-behind (Spanish, professional)
3. Landing page
4. Email confirmation on signup
5. Owner can disable employee accounts (payment enforcement)
6. Firebase Hosting migration + custom domain
7. Photo attachments per job
8. Full Spanish localization pass
9. Spite project: RAADS-R in Microsoft Excel

---

## Contact / Repo
- GitHub: https://github.com/legobele/nivelato
- Dev email: benjamin-lebron@intermetro.edu
- Uncle/client: dlebron@qgipr.com
