import type { GeneratedEmail } from "../types";

export interface FillMessageInput extends GeneratedEmail {
  to: string;
}

export interface MailActionResult {
  ok: boolean;
  message: string;
}

export interface MailAdapter {
  id: string;
  displayName: string;
  openCompose(): MailActionResult;
  fillCompose(input: FillMessageInput): Promise<MailActionResult>;
  copyText(text: string): Promise<MailActionResult>;
}
