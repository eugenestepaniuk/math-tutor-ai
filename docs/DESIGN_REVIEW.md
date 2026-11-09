# Phase 4 design review

Both original boards were visually inspected before implementation. They remain unchanged and excluded from Git. The written product requirements govern behavior; the boards establish composition and visual mood.

## Reference translation

| Area | Reference direction | Implemented behavior and intentional differences |
| --- | --- | --- |
| Home hero | Board 01: prominent blue educational hero, generous spacing and mathematical artwork | Original blue/violet CSS composition with SVG orbits and a formula-paper illustration. The fixed distributive identity is mathematically correct. No raster background, stock statue or copied screenshot is shipped. The mobile composition keeps the headline/CTA and omits decorative paper. |
| Home activity | Board 01: supporting progress and lesson cards | Completed equations, checked attempts and corrected reasoning errors come from actual saved events. Loading shows a dash before storage is read; fresh history shows actual zero counts. No screenshot percentages, streaks, XP, members or guessed personal name. |
| Current lesson and practice | Board 01: a clear route back to learning | Continue learning opens the saved Study solution; the lesson card shows the starting equation, last accepted step or submitted verified final value. Practice preserves the active problem or explicitly starts an already-offered related problem on click. Merely viewing Home never creates activity. |
| Study | Board 02: problem panel left, tutor right, compact navigation and key idea | Existing working layout, controlled KaTeX and verified history remain. The related-practice card now has the missing 16px top gap. Mobile retains problem-before-tutor ordering. There is no fixed fake chat; actual API state and errors stay visible. |
| Curriculum | Board 02: lightweight path, active lesson and supporting cards | Exactly one implemented lesson is launchable. Its completion bar represents a checked starter final value (zero or one available lessons), not inferred mastery or completion of unseen modules. Resetting the current solution preserves a previously recorded completion. Future topics are static Coming later cards with no fake controls. |
| Shared shell and interaction | Both boards: consistent blue selection, rounded cards, clear icons and readable typography | Existing Inter, KaTeX, owned ribbon mark and Lucide icons remain. Real breadcrumb links lead to Curriculum/the lesson anchor or Home; guest identity is a label. No unimplemented search, profile/settings buttons, subscriptions or notifications. Hover/press/focus feedback uses the existing short motion tokens; reduced-motion override stays in place. |

## States and accessibility

- Loading, genuine empty history, active draft, accepted steps, completion, existing practice and unavailable AI keep distinct text states. Curriculum never treats an unsubmitted draft as completion.
- The hero's decorative illustration is hidden from assistive technology. The actual current equation retains its math label and controlled KaTeX output.
- Breadcrumb links have a minimum 44px height/width, full keyboard focus and working destinations. Future topic cards are not focusable controls. Shared disabled links are dimmed and their handlers reject activation; disabled buttons do not receive enabled hover feedback.
- Primary actions span the phone layout. Navigation has five labeled destinations and preserves the existing safe-area inset. Small-screen form text remains at least 16px; formulas have their own scroll area when needed.
- Progress exposes a labeled native progress element. Numeric activity is accompanied by text labels; completion/mistakes never rely on color alone.
- No new decorative motion, fonts, external images or dependencies were added. The project remains explicitly light-themed; no dark theme or native app is claimed.

## Verification

The first read-only web-qa run passed all five routes at 1440/1024/768/390/360/375 (30 combinations), with no blocking findings. Home and Curriculum full-page captures at desktop/tablet/phone were visually compared with the boards: no material mismatch, clipping or overflow. After expanding the breadcrumb target and polishing disabled/pressed states, the final rerun again passed 30/30 combinations. Reduced-motion Home/Curriculum checks passed 2/2 at 375px. Reports: `/tmp/math-tutor-phase4-web-qa-final/` and `/tmp/math-tutor-phase4-reduced-motion-final/`. Only the previously accepted isolated logo and local canonical warnings remain informational.

124 unit/API/component/SDK tests pass, including Home's genuine zero/populated data, click-only related practice, noninteractive future topics and persisted Curriculum completion. Lint/typecheck pass. The expanded 27-scenario browser suite includes keyboard continuation, draft preservation, active-practice preservation and all five populated routes at six widths. The owner ran all 27 scenarios successfully in 35.5 seconds. All 30 populated screenshot artifacts were generated; Home/Curriculum were visually reviewed at every width (12 layouts), plus Study at 1440/390 and Practice/Progress at 390. No blockers were found, and the Study related-card gap is visibly corrected. Review sheets: `/tmp/math-tutor-phase4-populated-transitions.png` and `/tmp/math-tutor-phase4-populated-spots.png`. Mock-provider fixtures do not establish a live AI response.

Evidence and exact changed files are maintained in `IMPLEMENTATION_PROGRESS.md`. Phase 4 makes no new provider request, push or deployment. Successful real AI remains separately unverified after the previously recorded provider-limit error.
