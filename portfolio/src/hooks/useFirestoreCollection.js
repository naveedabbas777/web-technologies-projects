import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';

export default function useFirestoreCollection({
  db,
  collectionPath,
  orderField,
  orderDirection = 'asc',
  limitCount,
  defaultValue = [],
  enabled = true,
}) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !db || !collectionPath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const constraints = [];
    if (orderField) constraints.push(orderBy(orderField, orderDirection));
    if (typeof limitCount === 'number' && limitCount > 0) constraints.push(limit(limitCount));

    const ref = collection(db, collectionPath);
    const q = constraints.length ? query(ref, ...constraints) : query(ref);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, collectionPath, orderField, orderDirection, limitCount, enabled]);

  return { data, loading, error };
}
