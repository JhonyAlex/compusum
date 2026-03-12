## 2024-05-24 - Screen Reader Compatibility for Quantity Spans
**Learning:** Adding an `aria-label` to a native `<span>` (used for the quantity display) doesn't always yield the expected result in all screen readers unless it also has a generic role (like `role="text"` or `role="status"`).
**Action:** When adding labels to non-interactive textual elements to clarify meaning, ensure a valid role is also provided, or ideally use visually hidden text instead of `aria-label` on a `<span>`.
