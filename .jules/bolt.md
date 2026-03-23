## 2024-05-24 - Optimizing Zustand array dependencies in useEffect
**Learning:** When using Zustand global state arrays (like cart `items`) as dependencies in React `useEffect` for data fetching, passing the entire array causes redundant API requests when unrelated properties (like quantity) are updated.
**Action:** Extract and use primitive derived values (e.g., `categorySlug`, `itemIds`) during the render phase instead of passing the entire array into the dependency array.
