export type ContactStatus =
  | "Not contacted"
  | "Draft prepared"
  | "Sent"
  | "Replied"
  | "Rejected";

export type ContactRoleType =
  | "Software"
  | "Finance"
  | "Local business"
  | "General"
  | string;

export interface UserProfile {
  fullName: string;
  currentRole: string;
  location: string;
  skills: string;
  experienceSummary: string;
  availability: string;
  cvFilename: string;
  defaultSignOff: string;
}

export interface Contact {
  id: string;
  companyName: string;
  contactName?: string;
  emailAddress: string;
  website: string;
  roleType: ContactRoleType;
  notes: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedEmail {
  contactId: string;
  subject: string;
  body: string;
  generatedAt: string;
}

export interface WarmwireStorage {
  profile: UserProfile;
  contacts: Contact[];
  selectedContactId?: string;
  generatedDrafts: Record<string, GeneratedEmail>;
  settings: WarmwireSettings;
}

export interface WarmwireSettings {
  preferredOpportunityTypes: string;
  tone: "Concise" | "Warm" | "Formal";
}

export type AppTab = "Contacts" | "Profile" | "Generate" | "Settings";
