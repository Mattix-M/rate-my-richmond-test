'use client';
import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {data} from '@/lib/model';

const valid = new Set(data.professors.map(p => p.id));
export const cleanComparisonIds = (ids: string[]) => [...new Set(ids)].filter(id => valid.has(id)).slice(0, 3);
const Context = createContext<{ids: string[]; setIds: (ids: string[]) => void; toggle: (id: string) => void}>({ids: [], setIds: () => {}, toggle: () => {}});
export const useComparison = () => useContext(Context);

export function ComparisonProvider({children}: {children: React.ReactNode}) {
  const [ids, update] = useState<string[]>([]);
  const setIds = useCallback((next: string[]) => update(cleanComparisonIds(next)), []);
  const toggle = useCallback((id: string) => update(current => current.includes(id) ? current.filter(x => x !== id) : cleanComparisonIds([...current, id])), []);
  return <Context.Provider value={{ids, setIds, toggle}}>{children}</Context.Provider>;
}

export function CompareButton({id, name}: {id: string; name: string}) {
  const {ids, toggle} = useComparison();
  const active = ids.includes(id);
  return <button type="button" className="button compare-button" aria-pressed={active} aria-label={`${active ? 'Remove' : 'Add'} ${name} ${active ? 'from' : 'to'} comparison`} disabled={!active && ids.length >= 3} onClick={() => toggle(id)}>{active ? 'Added to comparison ✓' : ids.length >= 3 ? 'Comparison full' : 'Compare'}</button>;
}

export function ComparisonTray() {
  const {ids, setIds} = useComparison();
  const pathname = usePathname();
  const show = ids.length > 0 && !pathname.startsWith('/compare');
  useEffect(() => {
    document.body.classList.toggle('has-comparison', show);
    return () => document.body.classList.remove('has-comparison');
  }, [show]);
  if (!show) return null;
  return <aside className="comparison-tray" aria-label="Selected professors"><span aria-live="polite">{ids.length} of 3 selected</span><Link className="button dark" href={`/compare/?ids=${ids.join(',')}`}>Compare professors →</Link><button type="button" className="text-button" onClick={() => setIds([])}>Clear</button></aside>;
}
