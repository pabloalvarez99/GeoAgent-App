'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { fetchUserOrgs, fetchMember } from '@/lib/firebase/orgs';
import type { Member, Org } from '@/types/org';

interface OrgContextValue {
  orgs: Org[];
  currentOrg: Org | null;
  member: Member | null;
  loading: boolean;
  switchOrg: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);
const LS_KEY = 'geoagent.currentOrgId';

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setOrgs([]); setCurrentOrg(null); setMember(null); setLoading(false); return; }
    let alive = true;
    (async () => {
      const list = await fetchUserOrgs(user.uid);
      if (!alive) return;
      setOrgs(list);
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) : null;
      const pick = list.find((o) => o.id === stored) ?? list[0] ?? null;
      setCurrentOrg(pick);
      if (pick) setMember(await fetchMember(pick.id, user.uid));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const switchOrg = (orgId: string) => {
    const o = orgs.find((x) => x.id === orgId) ?? null;
    setCurrentOrg(o);
    if (typeof window !== 'undefined' && o) window.localStorage.setItem(LS_KEY, o.id);
    if (o && user) fetchMember(o.id, user.uid).then(setMember);
  };

  return (
    <OrgContext.Provider value={{ orgs, currentOrg, member, loading, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
