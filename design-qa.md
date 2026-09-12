# Design QA

## 2026-09-12 · Empty-data mobile install release

- Removed all seeded cars and customers. A new browser profile now opens with empty car-account and customer lists.
- Replaced fixed income and profit examples with live totals calculated from user-entered fees and quota percentages.
- Added a web app manifest, home-screen icons, standalone display mode, and a service worker for iPhone and Android home-screen use.
- Verified the production build and protected mobile runtime integrity check.
- Verified at iPhone preview width that the empty car page renders its add action and that the customer page shows zero for all four headline values.

- Source visual truth: `C:\Users\百万王叔\.codex\generated_images\01a093a0-ee2b-7041-8ea3-0881cfa6b4f6\exec-72dd4ab8-e743-4952-8f60-d7d40c95b8c4.png`, with the user's final instruction removing “未分配” from the drill-in summary.
- Implementation: `http://localhost:4173/`, captured and inspected in the Codex in-app browser.
- Reference pixels: 1680 × 941 presentation board; implementation target CSS viewport: 393 × 852 iPhone screen. Browser preview rendered scaled to 350.78 × 760.46 CSS px because of the surrounding device stage.
- State coverage: car overview, car drill-in, customer search, filter sheet, car rename persistence.

**Full-view comparison evidence**

The implementation preserves the reference hierarchy, white card system, blue actions, dense account list, and semantic green/orange/red/gray states. The car overview fits ten rows in one screen. The drill-in summary contains exactly 总额度、已拼、已拼成本、利润 plus the customer-state counts; “未分配” is absent.

**Focused-region comparison evidence**

The drill-in header and first two customer cards were inspected separately. Costs follow 10% = ¥80 and 20% = ¥160, customer cards include 上车时间 and 到期时间, and the personality label is 不好说话. The filter sheet exposes editable car name, status, reasons, tags, and sorting.

**Findings**

- No actionable P0, P1, or P2 mismatch remains.
- P3: the template's desktop device stage scales the phone slightly when the browser window is short; the app itself uses the protected 393 × 852 mobile viewport.

**Primary interactions tested**

- Open a car from the overview.
- Return to the overview.
- Open and close the filter sheet.
- Rename a car and verify the name persists after reload.
- Switch to the customer tab.
- Confirmed browser rendering and checked console output after the final key and sheet-height fixes.

**Implementation checklist**

- [x] Runtime integrity passed.
- [x] Production build passed.
- [x] Dense 20-account overview with pagination.
- [x] Four-value drill-in summary with no “未分配”.
- [x] Customer search/filter/sort controls.
- [x] Local persistence for car names.

final result: passed
