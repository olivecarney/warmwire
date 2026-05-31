import type { Contact, GeneratedEmail, UserProfile, WarmwireSettings } from "../types";

export interface EmailGenerator {
  generate(input: {
    contact: Contact;
    profile: UserProfile;
    settings: WarmwireSettings;
  }): GeneratedEmail;
}

const compact = (parts: string[]): string => parts.filter(Boolean).join(" ");

const trimToWordLimit = (text: string, maxWords: number): string => {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= maxWords ? text : `${words.slice(0, maxWords - 1).join(" ")}.`;
};

const greetingFor = (contact: Contact): string =>
  contact.contactName?.trim() ? `Hi ${contact.contactName.trim()},` : "Hi,";

export class RuleBasedEmailGenerator implements EmailGenerator {
  generate({
    contact,
    profile,
    settings
  }: {
    contact: Contact;
    profile: UserProfile;
    settings: WarmwireSettings;
  }): GeneratedEmail {
    const company = contact.companyName.trim() || "your team";
    const name = profile.fullName.trim() || "I";
    const role = profile.currentRole.trim();
    const skills = profile.skills.trim();
    const experience = profile.experienceSummary.trim();
    const availability = profile.availability.trim() || "available over the summer";
    const cvLine = profile.cvFilename.trim()
      ? `I can attach my CV (${profile.cvFilename.trim()}) if helpful.`
      : "I can attach my CV if helpful.";
    const opportunityTypes =
      settings.preferredOpportunityTypes.trim() ||
      "relevant opportunities where I could be useful";

    const intro = role
      ? `I am ${profile.fullName.trim() ? name + ", " : ""}${role}.`
      : `My name is ${name}.`;

    const capability = compact([
      skills ? `I have skills in ${skills}.` : "",
      experience ? `My experience includes ${experience}.` : ""
    ]);

    const body = [
      greetingFor(contact),
      "",
      compact([
        intro,
        `I am getting in touch because I am interested in ${company} and wanted to ask whether there may be any suitable ${opportunityTypes}.`
      ]),
      "",
      compact([
        capability,
        `I am ${availability}, and I would be glad to help with practical work where I can be useful while learning from the team.`
      ]),
      "",
      compact([
        "Would it be worth sending over a little more detail, or is there someone better I should contact?",
        cvLine
      ]),
      "",
      profile.defaultSignOff.trim() || "Best regards",
      profile.fullName.trim()
    ]
      .filter((line) => line !== undefined)
      .join("\n");

    return {
      contactId: contact.id,
      subject: `Summer work experience enquiry - ${company}`,
      body: trimToWordLimit(body, 180),
      generatedAt: new Date().toISOString()
    };
  }
}

export const emailGenerator: EmailGenerator = new RuleBasedEmailGenerator();
