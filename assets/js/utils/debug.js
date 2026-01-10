/**
 * Debug utilities
 */

export function createDebugger(namespace) {
  return {
    log: (...args) => console.log(`[${namespace}]`, ...args),
    warn: (...args) => console.warn(`[${namespace}]`, ...args),
    error: (...args) => console.error(`[${namespace}]`, ...args),
  };
}
