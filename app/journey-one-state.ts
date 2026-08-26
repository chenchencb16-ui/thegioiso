import { useCallback, useEffect, useState } from "react";

export const H1_STORAGE_KEY = "cyberkid:h1-footprint:v1";
export const IDENTITY_STORAGE_KEY = "cyberkid:identity:v1";
export const H1_CONSEQUENCE_STORAGE_KEY = "cyberkid:h1-consequences:v1";
export const H1_INVESTIGATOR_STORAGE_KEY = "cyberkid:h1-investigator:v1";
export const H1_CHAT_STORAGE_KEY = "cyberkid:h1-chat:v1";

export type H1Footprint = { birthMonth?: string; birthYear?: string | null; school?: string; routine?: string };
export type SimulatedIdentity = { nickname: string; avatar: number };
export type H1InvestigatorState = { opened: boolean; evidence: string[]; assembled: boolean; reflectionCompleted: boolean; reflectionSelections: string[] };
export type H1ChatState = { escalationByFingerprint: Record<string, number>; respondedFingerprints: string[] };

const defaultIdentity: SimulatedIdentity = { nickname: "Mây Pixel", avatar: 0 };
const defaultInvestigator: H1InvestigatorState = { opened: false, evidence: [], assembled: false, reflectionCompleted: false, reflectionSelections: [] };
export const defaultChatState: H1ChatState = { escalationByFingerprint: {}, respondedFingerprints: [] };
const footprintFields: (keyof H1Footprint)[] = ["birthMonth", "birthYear", "school", "routine"];

function parseStorage(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  } catch {
    return undefined;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

function readFootprint(): H1Footprint {
  const parsed = parseStorage(H1_STORAGE_KEY);
  if (!isRecord(parsed)) return {};
  const footprint: H1Footprint = {};
  for (const field of footprintFields) {
    const value = parsed[field];
    if (typeof value === "string" || (field === "birthYear" && value === null)) footprint[field] = value;
  }
  return footprint;
}

function readIdentity(): SimulatedIdentity {
  const parsed = parseStorage(IDENTITY_STORAGE_KEY);
  if (!isRecord(parsed) || typeof parsed.nickname !== "string" || typeof parsed.avatar !== "number" || !Number.isInteger(parsed.avatar)) return defaultIdentity;
  return { nickname: parsed.nickname, avatar: parsed.avatar };
}

function readConsequences(): string[] {
  const parsed = parseStorage(H1_CONSEQUENCE_STORAGE_KEY);
  return isStringArray(parsed) ? [...new Set(parsed)] : [];
}

function readInvestigator(): H1InvestigatorState {
  const parsed = parseStorage(H1_INVESTIGATOR_STORAGE_KEY);
  if (!isRecord(parsed)) return defaultInvestigator;
  return {
    opened: typeof parsed.opened === "boolean" ? parsed.opened : false,
    evidence: isStringArray(parsed.evidence) ? parsed.evidence : [],
    assembled: typeof parsed.assembled === "boolean" ? parsed.assembled : false,
    reflectionCompleted: typeof parsed.reflectionCompleted === "boolean" ? parsed.reflectionCompleted : false,
    reflectionSelections: isStringArray(parsed.reflectionSelections) ? parsed.reflectionSelections : [],
  };
}

export function readChatState(): H1ChatState {
  const parsed = parseStorage(H1_CHAT_STORAGE_KEY);
  if (!isRecord(parsed) || !isRecord(parsed.escalationByFingerprint)) return defaultChatState;
  const entries = Object.entries(parsed.escalationByFingerprint).filter((entry): entry is [string, number] => Number.isInteger(entry[1]) && Number(entry[1]) >= 0 && Number(entry[1]) <= 2);
  return { escalationByFingerprint: Object.fromEntries(entries), respondedFingerprints: isStringArray(parsed.respondedFingerprints) ? parsed.respondedFingerprints : [] };
}

export function writeChatState(state: H1ChatState) {
  if (typeof window !== "undefined") window.localStorage.setItem(H1_CHAT_STORAGE_KEY, JSON.stringify(state));
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
    queueMicrotask(() => {
      const investigator = readInvestigator();
      setFootprint(readFootprint());
      setIdentity(readIdentity());
      setShownConsequences(readConsequences());
      setInvestigatorOpened(investigator.opened);
      setEvidenceSeen(investigator.evidence);
      setProfileAssembled(investigator.assembled);
      setReflectionCompleted(investigator.reflectionCompleted);
      setReflectionSelections(investigator.reflectionSelections);
      setHydrated(true);
    });
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem(H1_STORAGE_KEY, JSON.stringify(footprint)); }, [footprint, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity)); }, [identity, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(H1_CONSEQUENCE_STORAGE_KEY, JSON.stringify(shownConsequences)); }, [shownConsequences, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_INVESTIGATOR_STORAGE_KEY, JSON.stringify({ opened: investigatorOpened, evidence: evidenceSeen, assembled: profileAssembled, reflectionCompleted, reflectionSelections }));
  }, [investigatorOpened, evidenceSeen, profileAssembled, reflectionCompleted, reflectionSelections, hydrated]);

  const recordFootprint = useCallback((field: keyof H1Footprint, value: string | null) => setFootprint((current) => ({ ...current, [field]: value })), []);
  const markConsequenceShown = useCallback((key: string) => setShownConsequences((current) => current.includes(key) ? current : [...current, key]), []);

  return { footprint, identity, setIdentity, recordFootprint, shownConsequences, markConsequenceShown, investigatorOpened, setInvestigatorOpened, evidenceSeen, setEvidenceSeen, profileAssembled, setProfileAssembled, reflectionCompleted, setReflectionCompleted, reflectionSelections, setReflectionSelections, hydrated };
}
