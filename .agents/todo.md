# Nivelato — Todo List

## App Logic
- [x] Validation logic (PAREDES NO CUADRAN, TECHO/PISO NO CUADRAN, FALTAN NIVELES DE TECHO, FALTA MEDIDA DEL HUECO)
- [x] LCD flicker on all inputs globally
- [x] Bug fix: wall validation now compares offsets directly, not against hueco size
- [ ] Spanish translation for all UI strings (full localization pass)
- [ ] Spite project: RAADS-R in Microsoft Excel (to counter mom's Copilot Excel arc)

## Firebase & Auth
- [ ] Firebase setup (auth + Firestore) — project: nivelato-app, region: nam5
- [ ] Organization / user division (shop = org, employees = users)
- [ ] Auth flow: /accounts/login + /accounts/signup (email + password, NO passwordless)
- [ ] Hardcoded constraint: 1 owner minimum per org (enforces $100/mo floor at 2 users)
- [ ] Protect app behind login
- [ ] Employee positions & permissions per org (owner, quoting, measuring, supervisor)
- [ ] Job history: every submission saved to Firestore under orgs/{orgId}/jobs/{jobId}
  - fields: installer uid, name, timestamp, hueco, all desniveles, warnings
- [ ] Owner/quoting dashboard — list/filter past jobs by date, installer, status
- [ ] Audit log of all actions (who measured what, when)
- [ ] Account configurations & access control
- [ ] Device-specific access (e.g. only company tablet allowed, not personal phones)

## Marketing
- [ ] Updated pitch email drafted (v2 with Firebase/cloud history benefits) — see below
- [ ] Landing page — professional and futuristic as FUCK
      (hosting screenshots on GitHub: put them in /docs/screenshots/ or /assets/ and link raw.githubusercontent.com URLs)
- [ ] Photography — workers measuring glass (Benj does mobile photography, needs editing similar to Apple Photos)
- [ ] Link everything up (landing page → app → contact)
- [ ] Pitch to other glass shops across PR (note: social communication deficits per DSM-5. plan accordingly 😭)
- [ ] Convince uncle re: exclusivity — he won't find another tool if we pitch to other shops first
- [ ] Copyright & trademark — formally register Nivelato™ as a trademark

## SaaS / Pricing (confirmed after tomorrow's test)
- [ ] $100 initial setup — 1 month trial, up to 5 users
- [ ] $50/mo/user after trial
- [ ] On-call bugfix fee — $20? (feeling off about this one, revisit)
- [ ] Pitch to uncle after successful hardware test tomorrow

## Deployment
- [x] GitHub Pages (legobele/nivelato)
- [ ] Migrate to Firebase Hosting once auth is in (custom domain ready)

## Notes
- Mom's product spec: "el técnico no tenga que pensar — la app hace las operaciones y le indica si algo está mal"
- Mom confirmed: levels needed on all 4 sides — NOT the middle (glass has no barriguitas)
- Glass cut varies per frame system — app just captures hueco + desniveles, no auto-cut calc
- Real test case: Derrick Champion order (espejo color bronce, 114 1/16" × ~47", techo sube 1/4" izq)
- Hardware: Bosch GLM 20 (distance) at home, Hilti PMC 30 (laser level) at shop
- Mom is on a Copilot/Excel arc. Nivelato is the answer. Stay the course.
- Firebase project: nivelato-app, Firestore region: nam5, auth: email+password only
