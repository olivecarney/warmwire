import type { GeneratedEmail } from "../types";
import type { MailActionResult } from "../mail/mailAdapter";

export interface FillComposeInput extends GeneratedEmail {
  to: string;
}

const composeButtonSelectors = [
  'div[gh="cm"]',
  '[role="button"][aria-label*="Compose"]',
  '[role="button"][data-tooltip*="Compose"]'
];

const composeDialogSelectors = [
  'div[role="dialog"]',
  'div[aria-label="Message Body"]'
];

const subjectSelectors = ['input[name="subjectbox"]', 'input[aria-label="Subject"]'];

const bodySelectors = [
  'div[aria-label="Message Body"][contenteditable="true"]',
  'div[g_editable="true"][contenteditable="true"]'
];

const toSelectors = [
  'input[aria-label="To recipients"]',
  'textarea[name="to"]',
  'input[name="to"]',
  'div[aria-label="To"] input'
];

function queryFirst<T extends Element>(selectors: string[], root: ParentNode = document): T | null {
  for (const selector of selectors) {
    const match = root.querySelector<T>(selector);
    if (match) return match;
  }
  return null;
}

function dispatchTextInput(element: HTMLElement): void {
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = Object.getPrototypeOf(element) as HTMLInputElement | HTMLTextAreaElement;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function findActiveComposeRoot(): ParentNode | null {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>(composeDialogSelectors[0]));
  const composeDialog = dialogs
    .reverse()
    .find((dialog) => queryFirst<HTMLElement>(bodySelectors, dialog));
  if (composeDialog) return composeDialog;

  const body = queryFirst<HTMLElement>(bodySelectors);
  return body?.closest('[role="dialog"]') ?? body?.parentElement ?? null;
}

export function openGmailCompose(): MailActionResult {
  const button = queryFirst<HTMLElement>(composeButtonSelectors);
  if (!button) {
    return { ok: false, message: "Could not find Gmail's Compose button." };
  }
  button.click();
  return { ok: true, message: "Opened Gmail compose. Review the draft before sending." };
}

export async function copyToClipboard(text: string): Promise<MailActionResult> {
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true, message: "Copied to clipboard." };
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied
      ? { ok: true, message: "Copied to clipboard." }
      : { ok: false, message: "Clipboard copy failed. Select and copy the draft manually." };
  }
}

export async function fillActiveGmailCompose(input: FillComposeInput): Promise<MailActionResult> {
  const root = findActiveComposeRoot();
  if (!root) {
    await copyToClipboard(`To: ${input.to}\nSubject: ${input.subject}\n\n${input.body}`);
    return {
      ok: false,
      message:
        "No active compose window was found. The draft was copied so you can paste it manually."
    };
  }

  const toField = queryFirst<HTMLInputElement | HTMLTextAreaElement>(toSelectors, root);
  const subjectField = queryFirst<HTMLInputElement>(subjectSelectors, root);
  const bodyField = queryFirst<HTMLElement>(bodySelectors, root);

  if (!toField || !subjectField || !bodyField) {
    const missing = [
      !toField ? "recipient" : "",
      !subjectField ? "subject" : "",
      !bodyField ? "body" : ""
    ].filter(Boolean);
    await copyToClipboard(`To: ${input.to}\nSubject: ${input.subject}\n\n${input.body}`);
    return {
      ok: false,
      message: `Could not find the Gmail ${missing.join(", ")} field. The draft was copied for manual paste.`
    };
  }

  toField.focus();
  setNativeValue(toField, input.to);
  toField.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

  subjectField.focus();
  setNativeValue(subjectField, input.subject);

  bodyField.focus();
  bodyField.textContent = input.body;
  dispatchTextInput(bodyField);

  return { ok: true, message: "Filled the active compose window. Review before sending." };
}
