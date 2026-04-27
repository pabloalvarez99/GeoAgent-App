'use client';
import { useState, useEffect } from 'react';

export type CoordFormat = 'DD' | 'DMS';

interface Preferences {
  coordFormat: CoordFormat;
  density: 'comfortable' | 'compact';
}

const KEY = 'geoagent-display-prefs';

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>({ coordFormat: 'DD', density: 'comfortable' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  function setCoordFormat(coordFormat: CoordFormat) {
    const next = { ...prefs, coordFormat };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  function setDensity(density: 'comfortable' | 'compact') {
    const next = { ...prefs, density };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  return { ...prefs, setCoordFormat, setDensity };
}
