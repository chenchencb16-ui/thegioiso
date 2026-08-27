import { useCallback, useEffect, useState } from "react";

export const H1_STORAGE_KEY = "cyberkid:h1-footprint:v1";
export const IDENTITY_STORAGE_KEY = "cyberkid:identity:v1";
export const H1_CONSEQUENCE_STORAGE_KEY = "cyberkid:h1-consequences:v1";
export const H1_INVESTIGATOR_STORAGE_KEY = "cyberkid:h1-investigator:v1";
export const H1_CHAT_STORAGE_KEY = "cyberkid:h1-chat:v1";
export const SOCIAL_ACTIVITY_STORAGE_KEY = "cyberkid:social-activity:v1";

export type H1Footprint = { birthMonth?: string; birthYear?: string | null; school?: string; routine?: string };
export type SimulatedIdentity = { nickname: string; avatar: number };
export type H1InvestigatorState = { opened: boolean; evidence: string[]; assembled: boolean; reflectionCompleted: boolean; reflectionSelections: string[] };
export type H1ChatState = { escalationByFingerprint: Record<string, number>; respondedFingerprints: string[] };
export type PlayerSocialPost = { id: string; momentId: string; caption: string; createdAt: number; exposures: string[] };
export type PlayerSocialComment = { id: string; postId: string; value: string; createdAt: number };
export type SocialActivityState = { posts: PlayerSocialPost[]; comments: PlayerSocialComment[]; reactions: string[]; shares: string[] };
export type ExposedInformationType = keyof H1Footprint | "class" | "schedule" | "homeAddress" | "phone";

const defaultIdentity: SimulatedIdentity = { nickname: "", avatar: 0 };
const defaultInvestigator: H1InvestigatorState = { opened: false, evidence: [], assembled: false, reflectionCompleted: false, reflectionSelections: [] };
export const defaultChatState: H1ChatState = { escalationByFingerprint: {}, respondedFingerprints: [] };
export const defaultSocialActivity: SocialActivityState = { posts: [], comments: [], reactions: [], shares: [] };
const footprintFields: (keyof H1Footprint)[] = ["birthMonth", "birthYear", "school", "routine"];
const socialExposureTypes: ExposedInformationType[] = ["school", "class", "schedule", "homeAddress", "phone"];

export function exposedInformationTypes(footprint: H1Footprint, socialActivity: SocialActivityState): ExposedInformationType[] {
  const exposed = new Set<ExposedInformationType>();
  for (const field of footprintFields) {
    const value = footprint[field];
    if (typeof value === "string" && value.trim()) exposed.add(field);
  }
  for (const post of socialActivity.posts) {
    for (const exposure of post.exposures) {
      if (socialExposureTypes.includes(exposure as ExposedInformationType)) exposed.add(exposure as ExposedInformationType);
    }
  }
  return [...exposed];
}

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

function readSocialActivity(): SocialActivityState {
  const parsed = parseStorage(SOCIAL_ACTIVITY_STORAGE_KEY);
  if (!isRecord(parsed)) return defaultSocialActivity;
  const posts = Array.isArray(parsed.posts) ? parsed.posts.filter((item): item is PlayerSocialPost => isRecord(item) && typeof item.id === "string" && typeof item.momentId === "string" && typeof item.caption === "string" && typeof item.createdAt === "number" && isStringArray(item.exposures)) : [];
  const comments = Array.isArray(parsed.comments) ? parsed.comments.filter((item): item is PlayerSocialComment => isRecord(item) && typeof item.id === "string" && typeof item.postId === "string" && typeof item.value === "string" && typeof item.createdAt === "number") : [];
  return {
    posts: [...new Map(posts.map((post) => [post.id, post])).values()].sort((a, b) => b.createdAt - a.createdAt),
    comments: [...new Map(comments.map((comment) => [comment.postId, comment])).values()],
    reactions: isStringArray(parsed.reactions) ? [...new Set(parsed.reactions)] : [],
    shares: isStringArray(parsed.shares) ? [...new Set(parsed.shares)] : [],
  };
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
  const [socialActivity, setSocialActivity] = useState<SocialActivityState>(defaultSocialActivity);
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
      setSocialActivity(readSocialActivity());
      setHydrated(true);
    });
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem(H1_STORAGE_KEY, JSON.stringify(footprint)); }, [footprint, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity)); }, [identity, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(H1_CONSEQUENCE_STORAGE_KEY, JSON.stringify(shownConsequences)); }, [shownConsequences, hydrated]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(H1_INVESTIGATOR_STORAGE_KEY, JSON.stringify({ opened: investigatorOpened, evidence: evidenceSeen, assembled: profileAssembled, reflectionCompleted, reflectionSelections }));
  }, [investigatorOpened, evidenceSeen, profileAssembled, reflectionCompleted, reflectionSelections, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(SOCIAL_ACTIVITY_STORAGE_KEY, JSON.stringify(socialActivity)); }, [socialActivity, hydrated]);

  const recordFootprint = useCallback((field: keyof H1Footprint, value: string | null) => setFootprint((current) => ({ ...current, [field]: value })), []);
  const markConsequenceShown = useCallback((key: string) => setShownConsequences((current) => current.includes(key) ? current : [...current, key]), []);

  return { footprint, identity, setIdentity, recordFootprint, shownConsequences, markConsequenceShown, investigatorOpened, setInvestigatorOpened, evidenceSeen, setEvidenceSeen, profileAssembled, setProfileAssembled, reflectionCompleted, setReflectionCompleted, reflectionSelections, setReflectionSelections, socialActivity, setSocialActivity, hydrated };
}
