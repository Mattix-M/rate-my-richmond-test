'use client';
import {useEffect, useState} from 'react';
import type {Review} from '@/lib/model';

const cache = new Map<string, Review[]>();
export function useReviews(id: string) {
  const [state, setState] = useState<{id: string; rows: Review[] | null; error: boolean}>({id, rows: null, error: false});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (cache.has(id)) {
      setState({id, rows: cache.get(id)!, error: false});
      return;
    }
    setState({id, rows: null, error: false});
    fetch(`/reviews/${id}.json`, {signal: controller.signal})
      .then(r => {if (!r.ok) throw new Error('Review request failed'); return r.json() as Promise<Review[]>;})
      .then(rows => {if (!controller.signal.aborted) {cache.set(id, rows); setState({id, rows, error: false});}})
      .catch(() => {if (!controller.signal.aborted) setState({id, rows: null, error: true});});
    return () => controller.abort();
  }, [id, attempt]);
  return {rows: state.id === id ? state.rows : null, error: state.id === id && state.error, retry: () => setAttempt(a => a + 1)};
}
