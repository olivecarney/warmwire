import type { Contact, GeneratedEmail, UserProfile, WarmwireSettings, WarmwireStorage } from "../types";
import { defaultStorage } from "./defaults";

const STORAGE_KEY = "warmwire";
const legacyValue = (encoded: string) => atob(encoded);
const LEGACY_CURRENT_ROLE = legacyValue("Q29tcHV0ZXIgU2NpZW5jZSBzdHVkZW50IGF0IHRoZSBVbml2ZXJzaXR5IG9mIExpdmVycG9vbA==");
const LEGACY_AVAILABILITY = legacyValue("YXZhaWxhYmxlIGZvciBwYWlkIHN1bW1lciB3b3JrIGV4cGVyaWVuY2U=");
const LEGACY_OPPORTUNITY_TYPES = legacyValue(
  "cGFpZCBzdW1tZXIgd29yayBleHBlcmllbmNlLCBpbnRlcm5zaGlwcywgdGVtcG9yYXJ5IGp1bmlvciBzdXBwb3J0LCBwcm9qZWN0L2FkbWluL3Rlc3RpbmcvZGF0YSB3b3Jr"
);

const cloneDefaultStorage = (): WarmwireStorage => ({
  ...defaultStorage,
  profile: { ...defaultStorage.profile },
  contacts: [],
  generatedDrafts: {},
  settings: { ...defaultStorage.settings }
});

const mergeStorage = (stored?: Partial<WarmwireStorage>): WarmwireStorage => {
  const fallback = cloneDefaultStorage();
  const merged = {
    ...fallback,
    ...stored,
    profile: { ...fallback.profile, ...stored?.profile },
    contacts: stored?.contacts ?? fallback.contacts,
    generatedDrafts: stored?.generatedDrafts ?? fallback.generatedDrafts,
    settings: { ...fallback.settings, ...stored?.settings }
  };
  if (merged.profile.currentRole === LEGACY_CURRENT_ROLE) merged.profile.currentRole = "";
  if (merged.profile.availability === LEGACY_AVAILABILITY) merged.profile.availability = "";
  if (merged.settings.preferredOpportunityTypes === LEGACY_OPPORTUNITY_TYPES) {
    merged.settings.preferredOpportunityTypes = "";
  }
  return merged;
};

export async function getWarmwireStorage(): Promise<WarmwireStorage> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return mergeStorage(result[STORAGE_KEY] as Partial<WarmwireStorage> | undefined);
}

export async function setWarmwireStorage(next: WarmwireStorage): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
}

export async function updateProfile(profile: UserProfile): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const next = { ...current, profile };
  await setWarmwireStorage(next);
  return next;
}

export async function updateSettings(settings: WarmwireSettings): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const next = { ...current, settings };
  await setWarmwireStorage(next);
  return next;
}

export async function upsertContact(contact: Contact): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const exists = current.contacts.some((item) => item.id === contact.id);
  const contacts = exists
    ? current.contacts.map((item) => (item.id === contact.id ? contact : item))
    : [contact, ...current.contacts];
  const next = {
    ...current,
    contacts,
    selectedContactId: current.selectedContactId ?? contact.id
  };
  await setWarmwireStorage(next);
  return next;
}

export async function deleteContact(contactId: string): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const generatedDrafts = { ...current.generatedDrafts };
  delete generatedDrafts[contactId];
  const next = {
    ...current,
    contacts: current.contacts.filter((contact) => contact.id !== contactId),
    selectedContactId:
      current.selectedContactId === contactId ? undefined : current.selectedContactId,
    generatedDrafts
  };
  await setWarmwireStorage(next);
  return next;
}

export async function selectContact(contactId?: string): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const next = { ...current, selectedContactId: contactId };
  await setWarmwireStorage(next);
  return next;
}

export async function saveGeneratedDraft(draft: GeneratedEmail): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const contacts = current.contacts.map((contact) =>
    contact.id === draft.contactId && contact.status === "Not contacted"
      ? { ...contact, status: "Draft prepared" as const, updatedAt: new Date().toISOString() }
      : contact
  );
  const next = {
    ...current,
    contacts,
    generatedDrafts: { ...current.generatedDrafts, [draft.contactId]: draft }
  };
  await setWarmwireStorage(next);
  return next;
}

export async function updateContactStatus(
  contactId: string,
  status: Contact["status"]
): Promise<WarmwireStorage> {
  const current = await getWarmwireStorage();
  const contacts = current.contacts.map((contact) =>
    contact.id === contactId ? { ...contact, status, updatedAt: new Date().toISOString() } : contact
  );
  const next = { ...current, contacts };
  await setWarmwireStorage(next);
  return next;
}
