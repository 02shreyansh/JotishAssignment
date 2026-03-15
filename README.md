# Employee Insights Dashboard

A high-performance, 4-screen employee insights dashboard built with **React 18 + TypeScript + raw Tailwind CSS**.

---

## Getting Started

```bash
npm install
npm run dev
```

**Credentials:** `testuser` / `Test123`

---

## Architecture

### Tech Stack
- **React 18** + **TypeScript** + **Vite**
- **React Router v6** for routing
- **Tailwind CSS** (raw, zero UI libraries)
- **Leaflet** for geospatial mapping
- **Context API** for state (Auth + Employee)

---

## Intentional Bug Documentation

### The Bug: Stale Closure in `useVirtualization` → Missing `containerRef` Dependency

**Location:** `src/hooks/useVirtualization.ts` — the `onScroll` callback and the `useEffect` that attaches it.

**What it is:**

```typescript
// In useVirtualization.ts
const onScroll = useCallback(() => {
  if (containerRef.current) {
    setScrollTop(containerRef.current.scrollTop);
  }
}, []); // ← BUG: empty dependency array

useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  el.addEventListener('scroll', onScroll, { passive: true });
  return () => el.removeEventListener('scroll', onScroll);
}, [onScroll]); // ← captures `el` at mount time via closure
```

**Why it's a bug:**

The `useEffect` captures `el = containerRef.current` in a closure at the time the effect runs. If the `containerRef` is reassigned (e.g., the component re-renders and mounts a new DOM node — which can happen during filter/sort changes that change `filtered.length`), the cleanup function still holds a reference to the **old** `el`. This means:

1. The event listener is removed from the old element (correct).
2. But the new `useEffect` run may briefly have `containerRef.current === null` before the new DOM node mounts, so `el` becomes `null` and **no listener is added to the new element**.
3. The scroll position `scrollTop` gets stuck at its last value — virtualization stops updating for the new filtered list until the user manually scrolls.

**Root cause:** Stale closure over `containerRef.current` inside `useEffect`, combined with an empty dependency array on `useCallback` that should include `containerRef` — except refs are mutable and don't trigger re-renders, making this a subtle trap.

**The correct fix** (not implemented, by design):

```typescript
// Fix 1: Use a callback ref instead of useRef for the container
const setContainerRef = useCallback((node: HTMLDivElement | null) => {
  containerRef.current = node;
  if (node) {
    node.addEventListener('scroll', handleScroll, { passive: true });
  }
}, [handleScroll]);

// Fix 2: Or add a resize observer so the effect re-runs when DOM changes
```

---

## Virtualization Math

**File:** `src/hooks/useVirtualization.ts`

Custom virtualization renders only visible rows + a small buffer. Here's the math:

```
Given:
  scrollTop      = current scroll offset (px) from containerRef.scrollTop
  itemHeight     = fixed row height (px) — we use 64px
  containerH     = visible viewport height (px)
  bufferSize     = extra rows above/below viewport — we use 8

1. startIndex = clamp(floor(scrollTop / itemHeight) - bufferSize, 0, total-1)
   → First visible item's index, minus buffer rows

2. visibleCount = ceil(containerH / itemHeight)
   → How many items fill the visible area

3. endIndex = clamp(startIndex + visibleCount + bufferSize * 2, 0, total-1)
   → Last item to render; buffer * 2 covers both top and bottom

4. For each i in [startIndex, endIndex]:
     offsetTop = i * itemHeight   (absolute position via position:absolute)

5. totalHeight = totalItems * itemHeight
   → The inner div's height, making the scrollbar accurate

Complexity: O(viewport/itemHeight) DOM nodes instead of O(N)
For 10,000 rows at 64px height in a 600px container:
  Without virtualization: 10,000 DOM nodes
  With virtualization:    ~(600/64) + 2*8 = ~26 DOM nodes
```

The scroll container uses `position: relative` with a single tall inner div (`height: totalHeight`). Each visible row is `position: absolute` with `top: offsetTop`. This matches the browser's native scroll behavior while keeping the DOM minimal.

---

## City-to-Coordinate Mapping

**File:** `src/utils/cityCoords.ts`

**Strategy:**

1. **Curated dictionary** — 40+ major Indian cities + global cities have hardcoded lat/lng (from OpenStreetMap data).

2. **Deterministic hash fallback** — For unknown cities not in the dictionary, we apply a polynomial hash over the city string's char codes:
   ```
   h = 0
   for each char c in city:
     h = (h * 31 + charCode(c)) mod 2^32
   lat = 6.5  + (h mod 1000) / 1000 * 31    → maps to [6.5, 37.5]°N
   lng = 68.0 + ((h >> 10) mod 1000) / 1000 * 29  → maps to [68, 97]°E
   ```
   This ensures every unknown city still appears within India's bounding box and is deterministic (same city always gets same coordinates).

3. **Leaflet circle markers** are sized proportionally to total salary — bigger circle = higher payroll city.

---

## Feature Checklist

| Feature | Status |
|---|---|
| Secure Auth with Context API | Done |
| Session persistence (localStorage) | Done |
| Protected routes (redirect on /list) | Done |
| Tab sync (storage event) | Done |
| POST API fetch with normalization | Done |
| Custom virtualization (own math) | Done |
| Sortable + searchable grid | Done |
| Dynamic routing /details/:id | Done |
| Native Camera API | Done |
| HTML5 Canvas signature overlay | Done |
| Photo + signature Blob merge | Done |
| Custom SVG salary chart | Done |
| Leaflet geospatial map | Done |
| Audit image gallery | Done |
| Intentional bug (documented) | Done |
| Zero UI libraries | Done |
| Zero react-window/virtualized | Done |
| Raw Tailwind CSS only | Done |

---

## Security Notes

- Credentials validated in-memory; no network call for auth
- Session expires after 24 hours
- Route guards prevent unauthenticated access via direct URL