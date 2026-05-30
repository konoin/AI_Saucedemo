# Code Review Findings

**Scope:** Pages, fixtures, flows, tests (documentation only — no risky refactors applied).

---

## Duplication

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| Login steps exist in `LoginPage` and `LoginFlow` | Low | Intentional layering; keep flow as spec entry point |
| Selector legacy exports mirror `Selectors.*` | Low | Keep until all pages import `Selectors` directly |
| Multiple browser projects run same single test | Low | Acceptable; consider chromium-only for smoke CI later |

---

## Dead code

| Item | Status |
|------|--------|
| `framework/components/.gitkeep` | Placeholder — not dead, reserved |
| `framework/helpers/.gitkeep` | Placeholder — not dead, reserved |
| Legacy `loginSelectors` exports | Used by pages — keep |
| `framework/scripts/generate-report.js` | Not wired in CI — document or integrate later |

**Action:** None required now.

---

## Unnecessary abstractions

| Item | Assessment |
|------|------------|
| Flows for single-step login | Justified — scales when auth setup repeats |
| Five page fixtures always injected | Acceptable for small suite; split fixtures when suite grows |
| `CheckoutCompletePage.expectThankYouMessage` | Borderline assertion-in-page; keep for readable Assert phase |

---

## Test quality

| Strength | Gap |
|----------|-----|
| Tags on checkout test | No negative/auth edge cases yet |
| Flow + fixture usage | Example specs not yet promoted to real tests |
| AI reporter | Not yet consumed by CI scripts |

---

## Configuration

| Item | Note |
|------|------|
| `testIgnore: **/*.example.ts` | Prevents accidental example execution |
| Trace/video on failure | Good for enterprise debugging |
| `prettierrc.js` empty at root | Consider `.prettierrc` in future cleanup (out of scope) |

---

## Safe improvements (future)

1. Wire `generate-report.js` to read `ai-report.json`
2. Migrate pages to `Selectors.login` instead of `loginSelectors`
3. Add `authenticatedPage` fixture to reduce login boilerplate
4. Move `checkout.spec.ts` into `checkout/` subfolder

---

## Conclusion

Framework structure is sound for current size. No high-risk dead code. Primary gap is **test coverage breadth**, not architecture quality.
