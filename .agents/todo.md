# Nivelato — Todo List

## App Logic
- [ ] Add validation: `lado_A - desnivel_A = lado_B - desnivel_B` — flag if measurements don't add up
- [ ] Add techo desnivel missing warning (mom noted "faltaron desniveles de techo" on real order)
- [ ] Spite project: RAADS-R in Microsoft Excel (to counter mom's Copilot Excel arc)

## Auth & Accounts
- [ ] Auth flow: /accounts/login + /accounts/signup
- [ ] Firebase setup (auth + db)
- [ ] Protect app behind login

## SaaS / Business
- [ ] Pricing model (current thinking):
    - $100 initial setup (firebase, deploy, config)
    - $50/mo/user — glass shop = 1 employee + uncle = $100/mo baseline
    - Breakdown: $50 covers Base44 plan, $50 is pure Benj money for shitposting & freedom
- [ ] Landing page
- [ ] Eventually: per-use pricing tier for bigger clients
- [ ] Figure out if Benj gets paid before or after deployment lol

## Deployment
- [ ] Currently on GitHub Pages (legobele/nivelato)
- [ ] Eventually migrate off static hosting when auth is added

## Notes
- Mom's product spec: "el técnico no tenga que pensar — la app hace las operaciones y le indica si algo está mal"
- Mom also confirmed: levels needed on all 4 sides (top, bottom, left, right) — NOT the middle (glass has no barriguitas)
- Glass cut size varies per frame SYSTEM, not a universal formula — app just captures hueco + desniveles
- Real test case: Derrick Champion order (espejo color bronce, 114 1/16" × ~47", walls off by 1/8" each side, techo sube 1/4" a la izquierda)
- Mom is on a Copilot/Excel arc. Nivelato is the answer. Stay the course.
