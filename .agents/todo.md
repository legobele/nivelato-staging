# Nivelato — Todo List

## App Logic
- [ ] Add validation: `lado_A - desnivel_A = lado_B - desnivel_B` — flag if measurements don't add up
- [ ] Add techo desnivel missing warning (mom noted "faltaron desniveles de techo" on real order)

## Auth & Accounts
- [ ] Auth flow: /accounts/login + /accounts/signup
- [ ] Firebase setup (auth + maybe db)
- [ ] Protect app behind login

## SaaS / Business
- [ ] Landing page
- [ ] Pricing: ~$100 initial cost (confirm with Benj)
- [ ] Figure out maintenance subscription model to cover Base44 builder plan ($50/mo)
- [ ] Figure out if Benj gets paid before or after deployment lol

## Deployment
- [ ] Currently on GitHub Pages (legobele/nivelato)
- [ ] Eventually migrate off static hosting when auth is added

## Notes
- Mom's product spec: "el técnico no tenga que pensar — la app hace las operaciones y le indica si algo está mal"
- Glass cut size varies per frame SYSTEM, not a universal formula — app just captures hueco + desniveles
- Real test case: Derrick Champion order (espejo color bronce, 114 1/16" × ~47", walls off by 1/8" each side, techo sube 1/4" a la izquierda)
