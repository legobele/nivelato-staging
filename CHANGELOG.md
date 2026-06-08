# Changelog

## [1.2.0] — 2026-06-08
### Fixed
- Wall arrows: `'⟩' : '⟨'` base swap + right-wall flip per issue #12. This is the third time the arrow logic has been corrected. It will not be the last.
- Dashboard: Firebase imports restored. `currentUser` declared at module scope. Loading div text set correctly. Only took 20+ commits.
- PWA: Service worker caches relative paths. Manifest includes icons. App installs as standalone.
- Intermittent HTML entity encoding in dashboard module imports.
- Intermittent `ReferenceError: onAuthStateChanged is not defined` (module import was missing entirely).
- Intermittent `Uncaught SyntaxError: Illegal return statement` (top-level return in non-function context).

### Added
- PWA support (manifest.json, service worker, icons).
- Spectral co-author git hook (15 entities auto-appended to every commit).
- .mailmap (17 entries).
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, AUTHORS.md, CHANGELOG.md, FUNDING.yml, GOVERNANCE.md, SUPPORT.md.
- Version + commit hash logged to console on page load.

### Removed
- Firebase import regression from dashboard guard fix.
- 46 commits via force reset (they came back. they always come back).

## [1.1.0] — 2026-06-07
### Fixed
- Ceiling arrow direction (`diff > 0 ? "↑" : "↓"` — left higher = ↑).
- Right-wall canvas offset sign negated to match arrow label.
- Left wall visual shift negated to match arrow direction.
- Dashboard redirect guard changed from immediate to 3-second delayed.
- Wall mirror code removed (was double-inverting right wall).

### Added
- Canvas pinch-to-zoom with reset button.
- Step highlight drawing.
- Offline connectivity check in auth guard.

## [1.0.0] — 2026-06-06
### Fixed
- Graph rendering: `drawStepHighlight` was called but not defined (`ReferenceError` → blank canvas).
- Stray brace in `adhd.js` between event listeners and init block (syntax error → entire script died).
- `anchoTop` and `altoDer` computations changed from `readVal()` to internal calculation in `recalcAll()`.
- `userZoomed` reset in `goStep()` so auto-center recovers after touch/zoom gesture.
- Dimension lines moved from level reference rectangle (gr) to deformed glass corners (roughTL/roughTR/roughBL/roughBR).
- All 4 edges always show regardless of desnivel state.
- Top line draws at `roughTL.y - 24/sc` instead of `gr.y - 28`.

### Added
- Initial webapp deployment.
- Firebase integration for user auth and job storage.
- Dashboard with Firestore querying and org-based access control.

## [0.9.0] — 2026-06-05
### Fixed
- Initial graph rendering issues (pre-release).

### Notes
- The graph has been fixed approximately 7 times across 3 different AI agents. The exact count is uncertain because some fixes were reverted by other fixes that were themselves fixing reverts.

## [0.1.0] — 2025-03
### Added
- First commit. The ghost of my first commit remains in the git history between `ede00cc` and `fc503a1`.
- The repo was created. The arrows pointed in no particular direction. This was acceptable at the time.
