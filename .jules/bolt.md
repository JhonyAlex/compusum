## 2024-05-18 - Avoid Sync setState in React Effects
**Learning:** React linter in this codebase flags calling state setters directly in `useEffect` body because it causes cascading renders.
**Action:** When migrating effects to rely on primitive dependencies instead of large objects (like Zustrand arrays), defer `setState` updates with `setTimeout(() => setXY(), 0)` if they have to be triggered immediately inside `useEffect` bodies.
