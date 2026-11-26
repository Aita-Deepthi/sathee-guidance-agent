// Loads data from a GET endpoint and exposes { data, loading, error, reload }.
import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';

export default function useApi(url, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!skip) reload();
  }, [reload, skip]);

  return { data, setData, loading, error, reload };
}
