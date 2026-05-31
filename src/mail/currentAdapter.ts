import { gmailAdapter } from "./gmailAdapter";
import type { MailAdapter } from "./mailAdapter";

export function getCurrentMailAdapter(): MailAdapter {
  return gmailAdapter;
}
