import { copyToClipboard, fillActiveGmailCompose, openGmailCompose } from "../gmail/gmailDom";
import type { MailAdapter } from "./mailAdapter";

export const gmailAdapter: MailAdapter = {
  id: "gmail",
  displayName: "Gmail",
  openCompose: openGmailCompose,
  fillCompose: fillActiveGmailCompose,
  copyText: copyToClipboard
};
