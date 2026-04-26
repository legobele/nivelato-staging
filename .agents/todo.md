# Nivelato — Todo List

## App Logic
- [x] Validation logic (PAREDES NO CUADRAN, TECHO/PISO NO CUADRAN, FALTAN NIVELES DE TECHO, FALTA MEDIDA DEL HUECO)
- [x] LCD flicker on all inputs globally
- [ ] Spite project: RAADS-R in Microsoft Excel (to counter mom's Copilot Excel arc)

## Firebase & Auth
- [ ] Firebase setup (auth + db)
- [ ] Organization / user division (shop = org, employees = users)
- [ ] Auth flow: /accounts/login + /accounts/signup
- [ ] Protect app behind login
- [ ] Employee positions & permissions per org
- [ ] Audit log of all actions (who measured what, when)
- [ ] Ability to send measurements straight to the shop's setup (some kind of dashboard)
- [ ] Account configurations & access control
- [ ] Device-specific access (e.g. only company tablet allowed, not personal phones)

## Marketing
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
- [ ] Eventually migrate to proper hosting when auth is added (Firebase Hosting maybe?)

## Notes
- Mom's product spec: "el técnico no tenga que pensar — la app hace las operaciones y le indica si algo está mal"
- Mom confirmed: levels needed on all 4 sides — NOT the middle (glass has no barriguitas)
- Glass cut varies per frame system — app just captures hueco + desniveles, no auto-cut calc
- Real test case: Derrick Champion order (espejo color bronce, 114 1/16" × ~47", techo sube 1/4" izq)
- Hardware: Bosch GLM 20 (distance) at home, Hilti PMC 30 (laser level) at shop
- Mom is on a Copilot/Excel arc. Nivelato is the answer. Stay the course.
