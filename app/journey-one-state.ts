import { useEffect, useState } from "react";

export const H1_STORAGE_KEY = "cyberkid:h1-footprint:v1";
export const IDENTITY_STORAGE_KEY = "cyberkid:identity:v1";
export const H1_CONSEQUENCE_STORAGE_KEY = "cyberkid:h1-consequences:v1";
export const H1_INVESTIGATOR_STORAGE_KEY = "cyberkid:h1-investigator:v1";

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
  const [investigatorOpened, setInvestigatorOpened] = useState(false);
  const [evidenceSeen, setEvidenceSeen] = useState<string[]>([]);
  const [profileAssembled, setProfileAssembled] = useState(false);
  const [reflectionCompleted, setReflectionCompleted] = useState(false);
  const [reflectionSelections, setReflectionSelections] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFootprint(readStorage(H1_STORAGE_KEY, {}));
    setIdentity(readStorage(IDENTITY_STORAGE_KEY, defaultIdentity));
    setShownConsequences(readStorage(H1_CONSEQUENCE_STORAGE_KEY, []));
    const investigator = readStorage(H1_INVESTIGATOR_STORAGE_KEY, { opened: false, evidence: [] as string[], assembled: false, reflectionCompleted: false, reflectionSelections: [] as string[] });
    setInvestigatorOpened(investigator.opened);
    setEvidenceSeen(investigator.evidence);
    setProfileAssembled(investigator.assembled);
    setReflectionCompleted(investigator.reflectionCompleted);
    setReflectionSelections(investigator.reflectionSelections);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_STORAGE_KEY, JSON.stringify(footprint));
  }, [footprint, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  }, [identity, hydrated]);

  useEffect(() => {
    if (hydrated) {
      const stored = readStorage(H1_CONSEQUENCE_STORAGE_KEY, []);
      const merged = [...new Set([...stored, ...shownConsequences])];
      window.localStorage.setItem(H1_CONSEQUENCE_STORAGE_KEY, JSON.stringify(merged));
      if (merged.length !== shownConsequences.length) setShownConsequences(merged);
    }
  }, [shownConsequences, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_INVESTIGATOR_STORAGE_KEY, JSON.stringify({ opened: investigatorOpened, evidence: evidenceSeen, assembled: profileAssembled, reflectionCompleted, reflectionSelections }));
  }, [investigatorOpened, evidenceSeen, profileAssembled, reflectionCompleted, reflectionSelections, hydrated]);

  const recordFootprint = (field: keyof H1Footprint, value: string | null) => {
    setFootprint((current) => ({ ...current, [field]: value }));
  };

  const markConsequenceShown = (key: string) => {
    if (shownConsequences.includes(key)) return;
    const next = [...new Set([...readStorage(H1_CONSEQUENCE_STORAGE_KEY, []), ...shownConsequences, key])];
    window.localStorage.setItem(H1_CONSEQUENCE_STORAGE_KEY, JSON.stringify(next));
    setShownConsequences((current) => current.includes(key) ? current : [...current, key]);
  };

  useEffect(() => {
    const sync = () => setShownConsequences((current) => {
      const next = readStorage(H1_CONSEQUENCE_STORAGE_KEY, []);
      return JSON.stringify(current) === JSON.stringify(next) ? current : next;
    });
    const interval = window.setInterval(sync, 250);
    return () => window.clearInterval(interval);
  }, []);

  return { footprint, identity, setIdentity, recordFootprint, shownConsequences, markConsequenceShown, investigatorOpened, setInvestigatorOpened, evidenceSeen, setEvidenceSeen, profileAssembled, setProfileAssembled, reflectionCompleted, setReflectionCompleted, reflectionSelections, setReflectionSelections, hydrated };
}
