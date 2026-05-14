import { useCallback, useEffect, useRef, useState } from 'react';

interface ApiDataState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useApiData<T>(load: () => Promise<T>, fallback: T): ApiDataState<T> {
  const [data, setData] = useState<T>(fallback);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const fallbackRef = useRef(fallback);
  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  fallbackRef.current = fallback;

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setError(null);
    load()
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((caught) => {
        if (active) {
          setData(fallbackRef.current);
          setError(caught instanceof Error ? caught.message : 'Unable to load API data');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [load, reloadToken]);

  return { data, isLoading, error, reload };
}
