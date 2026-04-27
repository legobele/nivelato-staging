# Nivelato — Todo List

## App Logic
- [x] Validation logic (PAREDES NO CUADRAN, TECHO/PISO NO CUADRAN, FALTAN NIVELES DE TECHO, FALTA MEDIDA DEL HUECO)
- [x] LCD flicker on all inputs globally
- [x] Join code visible + copy button on owner dashboard
- [ ] ⭐ MOM FEEDBACK: Hueco step needs 2 width points (arriba + abajo) AND 2 height points (izquierda + derecha) — opening itself can be out of square independently of wall lean
- [ ] ⭐ MOM FEEDBACK: Canvas must trace/draw the actual measurement lines on each side as the user inputs them (visual line tracing per side)
- [ ] Employee dashboard: past orders list + "Nueva Medida" button to jump straight to tool
- [ ] Photo attachments per measurement (measuring guy attaches job site photos; currently uploads to Google Drive manually)
- [ ] Spanish translation for all UI strings (full localization pass)
- [ ] Spite project: RAADS-R in Microsoft Excel (to counter mom's Copilot Excel arc)

## Firebase & Auth
- [x] Firebase project created (nivelato-app, nam5)
- [x] firebase-config.js live on GitHub Pages
- [x] login.html — email+password, role select, owner creates org + gets join code, employees use join code
- [x] auth-guard.js — redirects unauthenticated users to login, injects user pill into header
- [x] dashboard.html — owner/cotizador: stats, job history, filter by date/installer, tap to expand
- [x] adhd.js — auto-saves job to Firestore on every "Compartir" tap
- [x] firestore.rules — deployed (currently wide open: auth != null — LOCK DOWN BEFORE PROD)
- [ ] 🔥 Lock down Firestore rules before prod (currently `allow read, write: if request.auth != null`)
- [ ] TEST employee side: join with code → take measurement → verify it appears on owner dashboard
- [ ] Dashboard: owner can add/remove users directly (invite by email) without join code flow
- [ ] Hardcoded billing constraint UI (enforce min 1 owner + 1 user on signup flow)
- [ ] Device-specific access (e.g. only company tablet allowed, not personal phones)
- [ ] Migrate to Firebase Hosting (bye GitHub Pages, hello custom domain)

## Next Month (credits reset May 26)
- [ ] Email confirmation on signup (no more test@email.com in prod)
- [ ] Bannability: owner can disable employee accounts from dashboard UI
- [ ] Abuse protections: rate limiting, suspicious activity flags
- [ ] Org management: owner can remove users, change roles, view last active

## Marketing
- [x] Pitch email v1 (Spanish) — sent to uncle
- [x] Pitch email v2 with Firebase/cloud history benefits (Spanish) — sent to uncle
- [ ] ⭐ Pitch PDF — leave-behind for uncle + other shops (professional, in Spanish)
- [ ] Landing page — professional and futuristic as FUCK
- [ ] Photography — workers measuring glass
- [ ] Link everything up (landing page → app → contact)
- [ ] Pitch to other glass shops across PR
- [ ] Convince uncle re: exclusivity
- [ ] Copyright & trademark — formally register Nivelato™

## SaaS / Pricing
- [ ] $100 initial setup — 1 month trial, up to 5 users
- [ ] $50/mo/user after trial
- [ ] On-call bugfix fee — $20? (revisit)
- [ ] Pitch to uncle after successful hardware test at family shop

## Deployment
- [x] GitHub Pages (legobele/nivelato) — live
- [ ] Firebase Hosting migration (custom domain ready)

## Notes
- Mom's product spec: "el técnico no tenga que pensar — la app hace las operaciones y le indica si algo está mal"
- Mom confirmed: levels needed on all 4 sides — NOT the middle (glass has no barriguitas)
- Glass cut varies per frame system — app just captures hueco + desniveles, no auto-cut calc
- MOM FEEDBACK (2026-04-27): hueco needs ancho arriba + ancho abajo, and alto izquierda + alto derecha — the opening itself can be trapezoidal
- MOM FEEDBACK (2026-04-27): canvas should trace measurement lines on each side visually as user inputs
- Real test case: Derrick Champion order (espejo color bronce, 114 1/16" × ~47", techo sube 1/4" izq)
- Hardware: Bosch GLM 20 (distance) at home, Hilti PMC 30 (laser level) at shop
- Mom is on a Copilot/Excel arc. Nivelato is the answer. Stay the course.
- Firebase project: nivelato-app, Firestore region: nam5, auth: email+password only
- Org join code = first 6 chars of owner UID (uppercase). Owner sees it on signup alert + dashboard.
- WHOLE OFFICE HAS SEEN IT. Expectations are high. No pressure lol.
- Account disable = payment enforcement. "No measuring for you until you pay." — real sentence, 2026.
- Photo attachments: low priority, employee already uploads to Google Drive manually.
