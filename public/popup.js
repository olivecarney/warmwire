const STORAGE_KEY = "warmwire";
const defaultSettings = {
  preferredOpportunityTypes: "",
  tone: "Warm"
};
const LEGACY_OPPORTUNITY_TYPES = atob(
  "cGFpZCBzdW1tZXIgd29yayBleHBlcmllbmNlLCBpbnRlcm5zaGlwcywgdGVtcG9yYXJ5IGp1bmlvciBzdXBwb3J0LCBwcm9qZWN0L2FkbWluL3Rlc3RpbmcvZGF0YSB3b3Jr"
);

let currentStore;

const logo = document.getElementById("warmwire-logo");
const contactCount = document.getElementById("contact-count");
const draftCount = document.getElementById("draft-count");
const tone = document.getElementById("tone");
const opportunityWording = document.getElementById("opportunity-wording");
const message = document.getElementById("popup-message");
const saveButton = document.getElementById("save-settings");
const openGmailButton = document.getElementById("open-gmail");

function mergeStorage(stored) {
  return {
    profile: {},
    contacts: [],
    selectedContactId: undefined,
    generatedDrafts: {},
    settings: defaultSettings,
    ...stored,
    settings: {
      ...defaultSettings,
      ...(stored?.settings ?? {})
    }
  };
}

async function loadStorage() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  currentStore = mergeStorage(result[STORAGE_KEY]);
  if (currentStore.settings.preferredOpportunityTypes === LEGACY_OPPORTUNITY_TYPES) {
    currentStore.settings.preferredOpportunityTypes = "";
  }
  contactCount.textContent = String(currentStore.contacts.length);
  draftCount.textContent = String(Object.keys(currentStore.generatedDrafts).length);
  tone.value = currentStore.settings.tone;
  opportunityWording.value = currentStore.settings.preferredOpportunityTypes;
  message.textContent = "Open your mailbox to use the side panel for contacts and drafts.";
}

async function saveSettings() {
  if (!currentStore) return;
  currentStore = {
    ...currentStore,
    settings: {
      tone: tone.value,
      preferredOpportunityTypes: opportunityWording.value
    }
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: currentStore });
  message.textContent = "Settings saved.";
}

async function openGmail() {
  await chrome.tabs.create({ url: "https://mail.google.com/" });
  window.close();
}

logo.src = chrome.runtime.getURL("assets/warmwirelogo.png");
saveButton.addEventListener("click", saveSettings);
openGmailButton.addEventListener("click", openGmail);
void loadStorage();
