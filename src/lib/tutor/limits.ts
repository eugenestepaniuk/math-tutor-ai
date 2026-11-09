export function createTutorLimit(now: () => number = Date.now) {
  let windowStart = now();
  let count = 0;
  let active = 0;
  return {
    acquire(): (() => void) | null {
      const time = now();
      if (time - windowStart >= 60_000) { windowStart = time; count = 0; }
      if (count >= 30 || active >= 2) return null;
      count++; active++;
      let released = false;
      return () => { if (!released) { active--; released = true; } };
    },
  };
}
