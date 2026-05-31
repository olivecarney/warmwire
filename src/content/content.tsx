import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AppTab, Contact, ContactStatus, GeneratedEmail, UserProfile, WarmwireSettings, WarmwireStorage } from "../types";
import {
  deleteContact,
  getWarmwireStorage,
  saveGeneratedDraft,
  selectContact,
  updateContactStatus,
  updateProfile,
  updateSettings,
  upsertContact
} from "../storage/storage";
import { emailGenerator } from "../generator/emailGenerator";
import { getCurrentMailAdapter } from "../mail/currentAdapter";
import "./content.css";

const tabs: AppTab[] = ["Contacts", "Profile", "Generate", "Settings"];
const statuses: ContactStatus[] = ["Not contacted", "Draft prepared", "Sent", "Replied", "Rejected"];
const roleTypes = ["Software", "Finance", "Local business", "General"];
const mailAdapter = getCurrentMailAdapter();

const emptyContact = (): Contact => ({
  id: crypto.randomUUID(),
  companyName: "",
  contactName: "",
  emailAddress: "",
  website: "",
  roleType: "Software",
  notes: "",
  status: "Not contacted",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="ww-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("Contacts");
  const [store, setStore] = useState<WarmwireStorage | null>(null);
  const [editingContact, setEditingContact] = useState<Contact>(emptyContact());
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getWarmwireStorage().then((next) => {
      setStore(next);
      const selected = next.contacts.find((contact) => contact.id === next.selectedContactId);
      setEditingContact(selected ?? emptyContact());
    });
  }, []);

  const selectedContact = useMemo(
    () => store?.contacts.find((contact) => contact.id === store.selectedContactId),
    [store]
  );
  const selectedDraft = selectedContact ? store?.generatedDrafts[selectedContact.id] : undefined;

  const persistProfile = async (profile: UserProfile) => {
    setStore(await updateProfile(profile));
    setMessage("Profile saved locally.");
  };

  const persistSettings = async (settings: WarmwireSettings) => {
    setStore(await updateSettings(settings));
    setMessage("Settings saved locally.");
  };

  const saveContact = async () => {
    if (!editingContact.companyName.trim() || !editingContact.emailAddress.trim()) {
      setMessage("Company name and email address are required.");
      return;
    }
    const nextContact = { ...editingContact, updatedAt: new Date().toISOString() };
    const next = await upsertContact(nextContact);
    setStore(next);
    setEditingContact(emptyContact());
    setMessage("Contact saved locally.");
  };

  const chooseContact = async (contact: Contact) => {
    setStore(await selectContact(contact.id));
    setEditingContact(contact);
    setActiveTab("Generate");
    setMessage(`Selected ${contact.companyName}.`);
  };

  const removeContact = async (contactId: string) => {
    setStore(await deleteContact(contactId));
    setEditingContact(emptyContact());
    setMessage("Contact deleted.");
  };

  const generateDraft = async () => {
    if (!store || !selectedContact) {
      setMessage("Select a contact first.");
      return;
    }
    const draft = emailGenerator.generate({
      contact: selectedContact,
      profile: store.profile,
      settings: store.settings
    });
    setStore(await saveGeneratedDraft(draft));
    setMessage("Draft prepared. Review and edit before filling Gmail.");
  };

  const copyDraftPart = async (part: "subject" | "body") => {
    if (!selectedDraft) {
      setMessage("Generate a draft first.");
      return;
    }
    const result = await mailAdapter.copyText(selectedDraft[part]);
    setMessage(result.message);
  };

  const fillCompose = async () => {
    if (!selectedContact || !selectedDraft) {
      setMessage("Select a contact and generate a draft first.");
      return;
    }
    const result = await mailAdapter.fillCompose({
      ...selectedDraft,
      to: selectedContact.emailAddress
    });
    setMessage(result.message);
  };

  const markAsSent = async () => {
    if (!selectedContact) return;
    setStore(await updateContactStatus(selectedContact.id, "Sent"));
    setMessage("Marked as sent. Gmail still requires manual sending.");
  };

  const selectNextNotContacted = async () => {
    if (!store) return;
    const next = store.contacts.find((contact) => contact.status === "Not contacted");
    if (!next) {
      setMessage("No not-contacted contacts left.");
      return;
    }
    await chooseContact(next);
  };

  if (!store) {
    return (
      <button className="ww-launcher">
        <span>Warmwire</span>
      </button>
    );
  }

  return (
    <>
      <button className="ww-launcher" onClick={() => setIsOpen((value) => !value)}>
        <span>Warmwire</span>
      </button>
      <aside className={`ww-panel ${isOpen ? "ww-panel-open" : ""}`} aria-label="Warmwire outreach panel">
        <header className="ww-header">
          <div className="ww-brand">
            <div>
              <p className="ww-kicker">{mailAdapter.displayName} assistant</p>
              <h1>Warmwire</h1>
            </div>
          </div>
          <button className="ww-icon-button" onClick={() => setIsOpen(false)} aria-label="Close Warmwire panel">
            x
          </button>
        </header>

        <p className="ww-safety">Warmwire prepares one email at a time. Always review before sending.</p>

        <nav className="ww-tabs" aria-label="Warmwire sections">
          {tabs.map((tab) => (
            <button key={tab} className={tab === activeTab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </nav>

        <main className="ww-main">
          {activeTab === "Contacts" && (
            <ContactsTab
              contacts={store.contacts}
              editingContact={editingContact}
              selectedContactId={store.selectedContactId}
              setEditingContact={setEditingContact}
              saveContact={saveContact}
              chooseContact={chooseContact}
              removeContact={removeContact}
            />
          )}

          {activeTab === "Profile" && (
            <ProfileTab profile={store.profile} onSave={persistProfile} />
          )}

          {activeTab === "Generate" && (
            <GenerateTab
              contact={selectedContact}
              draft={selectedDraft}
              mailDisplayName={mailAdapter.displayName}
              generateDraft={generateDraft}
              openCompose={() => setMessage(mailAdapter.openCompose().message)}
              fillCompose={fillCompose}
              copySubject={() => copyDraftPart("subject")}
              copyBody={() => copyDraftPart("body")}
              markAsSent={markAsSent}
              nextContact={selectNextNotContacted}
            />
          )}

          {activeTab === "Settings" && (
            <SettingsTab settings={store.settings} onSave={persistSettings} />
          )}
        </main>

        {message && <footer className="ww-toast">{message}</footer>}
      </aside>
    </>
  );
}

function ContactsTab({
  contacts,
  editingContact,
  selectedContactId,
  setEditingContact,
  saveContact,
  chooseContact,
  removeContact
}: {
  contacts: Contact[];
  editingContact: Contact;
  selectedContactId?: string;
  setEditingContact: (contact: Contact) => void;
  saveContact: () => void;
  chooseContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
}) {
  return (
    <section className="ww-stack">
      <div className="ww-section-head">
        <h2>Targets</h2>
        <button className="ww-secondary" onClick={() => setEditingContact(emptyContact())}>
          New
        </button>
      </div>

      <div className="ww-contact-list">
        {contacts.length === 0 && <p className="ww-empty">Add one target to start a manual outreach draft.</p>}
        {contacts.map((contact) => (
          <article key={contact.id} className={`ww-contact ${selectedContactId === contact.id ? "selected" : ""}`}>
            <button className="ww-contact-main" onClick={() => chooseContact(contact)}>
              <strong>{contact.companyName}</strong>
              <span>{contact.emailAddress}</span>
            </button>
            <span className={`ww-badge ${contact.status.toLowerCase().replace(/\s+/g, "-")}`}>{contact.status}</span>
            <div className="ww-row">
              <button className="ww-ghost" onClick={() => setEditingContact(contact)}>
                Edit
              </button>
              <button className="ww-ghost danger" onClick={() => removeContact(contact.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="ww-form">
        <Field label="Company name" value={editingContact.companyName} onChange={(companyName) => setEditingContact({ ...editingContact, companyName })} />
        <Field label="Contact name optional" value={editingContact.contactName ?? ""} onChange={(contactName) => setEditingContact({ ...editingContact, contactName })} />
        <Field label="Email address" value={editingContact.emailAddress} onChange={(emailAddress) => setEditingContact({ ...editingContact, emailAddress })} />
        <Field label="Website" value={editingContact.website} onChange={(website) => setEditingContact({ ...editingContact, website })} />
        <label className="ww-field">
          <span>Role/type</span>
          <select value={editingContact.roleType} onChange={(event) => setEditingContact({ ...editingContact, roleType: event.target.value })}>
            {roleTypes.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>
        <label className="ww-field">
          <span>Status</span>
          <select value={editingContact.status} onChange={(event) => setEditingContact({ ...editingContact, status: event.target.value as ContactStatus })}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <Field label="Notes" value={editingContact.notes} onChange={(notes) => setEditingContact({ ...editingContact, notes })} multiline />
        <button className="ww-primary" onClick={saveContact}>Save contact</button>
      </div>
    </section>
  );
}

function ProfileTab({ profile, onSave }: { profile: UserProfile; onSave: (profile: UserProfile) => void }) {
  const [draft, setDraft] = useState(profile);

  useEffect(() => setDraft(profile), [profile]);

  return (
    <section className="ww-form">
      <Field label="Full name" value={draft.fullName} placeholder="e.g. Alex Morgan" onChange={(fullName) => setDraft({ ...draft, fullName })} />
      <Field label="Current role / education" value={draft.currentRole} placeholder="e.g. Student, graduate, junior developer, analyst" onChange={(currentRole) => setDraft({ ...draft, currentRole })} />
      <Field label="Location" value={draft.location} placeholder="e.g. Manchester, remote, open to relocate" onChange={(location) => setDraft({ ...draft, location })} />
      <Field label="Skills" value={draft.skills} placeholder="e.g. React, Excel, customer support, research" onChange={(skills) => setDraft({ ...draft, skills })} multiline />
      <Field label="Experience summary" value={draft.experienceSummary} placeholder="e.g. Projects, part-time work, volunteering, coursework" onChange={(experienceSummary) => setDraft({ ...draft, experienceSummary })} multiline />
      <Field label="Availability" value={draft.availability} placeholder="e.g. Available part-time, full-time, summer, weekends" onChange={(availability) => setDraft({ ...draft, availability })} />
      <Field label="CV filename reminder" value={draft.cvFilename} placeholder="e.g. CV.pdf" onChange={(cvFilename) => setDraft({ ...draft, cvFilename })} />
      <Field label="Default sign-off" value={draft.defaultSignOff} placeholder="e.g. Best regards" onChange={(defaultSignOff) => setDraft({ ...draft, defaultSignOff })} />
      <button className="ww-primary" onClick={() => onSave(draft)}>Save profile</button>
    </section>
  );
}

function GenerateTab({
  contact,
  draft,
  mailDisplayName,
  generateDraft,
  openCompose,
  fillCompose,
  copySubject,
  copyBody,
  markAsSent,
  nextContact
}: {
  contact?: Contact;
  draft?: GeneratedEmail;
  mailDisplayName: string;
  generateDraft: () => void;
  openCompose: () => void;
  fillCompose: () => void;
  copySubject: () => void;
  copyBody: () => void;
  markAsSent: () => void;
  nextContact: () => void;
}) {
  return (
    <section className="ww-stack">
      <div className="ww-current">
        <span>Selected contact</span>
        <strong>{contact ? contact.companyName : "None selected"}</strong>
        {contact && <small>{contact.emailAddress}</small>}
      </div>

      <div className="ww-grid-actions">
        <button className="ww-primary" onClick={generateDraft}>Generate email</button>
        <button className="ww-secondary" onClick={nextContact}>Next not contacted</button>
      </div>

      <div className="ww-preview">
        <label>
          <span>Subject</span>
          <input readOnly value={draft?.subject ?? ""} placeholder="Generate a draft to preview subject" />
        </label>
        <label>
          <span>Body</span>
          <textarea readOnly value={draft?.body ?? ""} placeholder="Generate a draft to preview body" />
        </label>
      </div>

      <div className="ww-grid-actions">
        <button className="ww-secondary" onClick={openCompose}>Open {mailDisplayName} compose</button>
        <button className="ww-primary" onClick={fillCompose}>Fill compose</button>
        <button className="ww-secondary" onClick={copySubject}>Copy subject</button>
        <button className="ww-secondary" onClick={copyBody}>Copy body</button>
        <button className="ww-secondary" onClick={markAsSent}>Mark as sent</button>
      </div>
    </section>
  );
}

function SettingsTab({ settings, onSave }: { settings: WarmwireSettings; onSave: (settings: WarmwireSettings) => void }) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => setDraft(settings), [settings]);

  return (
    <section className="ww-form">
      <label className="ww-field">
        <span>Tone</span>
        <select value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value as WarmwireSettings["tone"] })}>
          <option>Warm</option>
          <option>Concise</option>
          <option>Formal</option>
        </select>
      </label>
      <Field
        label="Opportunity wording"
        value={draft.preferredOpportunityTypes}
        placeholder="e.g. internships, freelance projects, junior roles, temporary support"
        onChange={(preferredOpportunityTypes) => setDraft({ ...draft, preferredOpportunityTypes })}
        multiline
      />
      <p className="ww-note">
        No AI provider, tracking pixel, bulk send, inbox scraping, Gmail API, or OAuth is used in this MVP.
      </p>
      <button className="ww-primary" onClick={() => onSave(draft)}>Save settings</button>
    </section>
  );
}

const rootId = "warmwire-root";
if (!document.getElementById(rootId)) {
  const rootElement = document.createElement("div");
  rootElement.id = rootId;
  document.body.append(rootElement);
  createRoot(rootElement).render(<App />);
}
