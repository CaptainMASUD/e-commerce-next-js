// src/Components/Utils/routeLoader.js
/**
 * Ensures a minimum delay so loaders don’t flicker.
 * Usage: await withMinDelay(fetch(...), { minDelayMs: 180 })
 */
export function withMinDelay(promise, { minDelayMs = 0 } = {}) {
  const delay = minDelayMs
    ? new Promise((r) => setTimeout(r, minDelayMs))
    : Promise.resolve();

  return Promise.all([promise, delay]).then(([res]) => res);
}
