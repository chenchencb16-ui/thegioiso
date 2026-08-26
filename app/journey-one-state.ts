import { useEffect, useState } from "react";

export const H1_STORAGE_KEY = "cyberkid:h1-footprint:v1";
export const IDENTITY_STORAGE_KEY = "cyberkid:identity:v1";

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
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

export function useJourneyOneState() {
  const [footprint, setFootprint] = useState<H1Footprint>({});
  const [identity, setIdentity] = useState<SimulatedIdentity>(defaultIdentity);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFootprint(readStorage(H1_STORAGE_KEY, {}));
    setIdentity(readStorage(IDENTITY_STORAGE_KEY, defaultIdentity));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_STORAGE_KEY, JSON.stringify(footprint));
  }, [footprint, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  }, [identity, hydrated]);

  const recordFootprint = (field: keyof H1Footprint, value: string | null) => {
    setFootprint((current) => ({ ...current, [field]: value }));
  };

  return { footprint, identity, setIdentity, recordFootprint };
}
