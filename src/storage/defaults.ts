import type { UserProfile, WarmwireSettings, WarmwireStorage } from "../types";

export const defaultProfile: UserProfile = {
  fullName: "",
  currentRole: "",
  location: "",
  skills: "",
  experienceSummary: "",
  availability: "",
  cvFilename: "",
  defaultSignOff: ""
};

export const defaultSettings: WarmwireSettings = {
  preferredOpportunityTypes: "",
  tone: "Warm"
};

export const defaultStorage: WarmwireStorage = {
  profile: defaultProfile,
  contacts: [],
  selectedContactId: undefined,
  generatedDrafts: {},
  settings: defaultSettings
};
