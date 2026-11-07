import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
/** Keep list context in navigation history so Back restores the same query and page. */
export function useUrlFilters<T extends object>(initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [defaults] = useState(initial);
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => {
    const next = { ...defaults } as Record<string, unknown>;
    for (const [key, raw] of params) {
      if (!(key in defaults)) continue;
      const fallback = (defaults as Record<string, unknown>)[key];
      if (typeof fallback === 'number' || (fallback === null && /Id$/.test(key))) {
        const value = Number(raw); if (Number.isFinite(value) && value >= 0) next[key] = value;
      } else if (typeof fallback === 'boolean') next[key] = raw === 'true';
      else next[key] = raw;
    }
    return next as T;
  }, [defaults, params]);
  const setFilters = useCallback<Dispatch<SetStateAction<T>>>(action => {
    const next = typeof action === 'function' ? (action as (previous: T) => T)(filters) : action;
    const query = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value == null || value === '') query.delete(key); else query.set(key, String(value));
    }
    setParams(query, { replace: true });
  }, [filters, params, setParams]);
  return [filters, setFilters];
}
