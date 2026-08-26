import { useEffect, useState } from "react";

export const H1_STORAGE_KEY = "cyberkid:h1-footprint:v1";
export const IDENTITY_STORAGE_KEY = "cyberkid:identity:v1";
export const H1_CONSEQUENCE_STORAGE_KEY = "cyberkid:h1-consequences:v1";

export type H1Footprint = {
  birthMonth?: string;
  birthYear?: string | null;
  school?: string;
  routine?: string;
};

export type SimulatedIdentity = {
  nickname: string;
  avatar: number;
};

const defaultIdentity: SimulatedIdentity = { nickname: "Mây Pixel", avatar: 0 };

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value) as T;
    return Array.isArray(fallback) ? parsed : { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function useJourneyOneState() {
  const [footprint, setFootprint] = useState<H1Footprint>({});
  const [identity, setIdentity] = useState<SimulatedIdentity>(defaultIdentity);
  const [shownConsequences, setShownConsequences] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFootprint(readStorage(H1_STORAGE_KEY, {}));
    setIdentity(readStorage(IDENTITY_STORAGE_KEY, defaultIdentity));
    setShownConsequences(readStorage(H1_CONSEQUENCE_STORAGE_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_STORAGE_KEY, JSON.stringify(footprint));
  }, [footprint, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  }, [identity, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_CONSEQUENCE_STORAGE_KEY, JSON.stringify(shownConsequences));
  }, [shownConsequences, hydrated]);

  const recordFootprint = (field: keyof H1Footprint, value: string | null) => {
    setFootprint((current) => ({ ...current, [field]: value }));
  };

  const markConsequenceShown = (key: string) => {
    setShownConsequences((current) => current.includes(key) ? current : [...current, key]);
  };

  return { footprint, identity, setIdentity, recordFootprint, shownConsequences, markConsequenceShown };
}
