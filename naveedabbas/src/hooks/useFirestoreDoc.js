import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

export default function useFirestoreDoc({
  db,
  path,
  defaultValue = null,
  enabled = true,
}) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const pathKey = useMemo(() => {
    if (!Array.isArray(path)) return '';
    return path.join('/');
  }, [Array.isArray(path) ? path.join('/') : '']);

  const pathSegments = useMemo(() => {
    if (!pathKey) return [];
    return pathKey.split('/');
  }, [pathKey]);

  useEffect(() => {
    if (!enabled || !db || pathSegments.length < 2) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = doc(db, ...pathSegments);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? snap.data() : defaultValue);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, enabled, defaultValue, pathKey]);

  return { data, loading, error };
}
