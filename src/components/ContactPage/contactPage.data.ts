// The contact page's built-in text. Each piece can be changed in the Studio
// (Pages > Contact page); an empty field there shows the text below.

export const contactPageDefaults = {
  eyebrow: "Get in touch",
  titleLead: "Let's find your",
  titleAccent: "right direction.",
  lead: "No bots. No templates. A real person reads every message and responds within 48 hours.",
  emailLabel: "Email us directly",
  bookingLabel: "Book a call",
  bookingLinkText: "Schedule a call",
  locationLabel: "Based in",
  locationText: "Edinburgh, Scotland, UK",
  socialsLabel: "Follow us",
  eligTitle: "Not sure where to start?",
  eligText:
    "Take our free eligibility check. It takes 3 minutes and gives you a clear picture of your options.",
  eligButton: "Take the eligibility Test →",
  tabStudent: "I'm a student",
  tabCollab: "Collaboration",
  tabGeneral: "General",
  nameLabel: "Full name",
  emailFieldLabel: "Email",
  countryLabel: "Interested in studying",
  countries: ["United Kingdom", "Canada", "Australia", "USA", "Europe", "Other"],
  levelLabel: "Study level",
  levels: ["Undergraduate", "Postgraduate", "PhD", "Foundation"],
  orgLabel: "Organisation / Project",
  messageLabel: "Message",
  messageHintStudent:
    "What's on your mind? Tell us about your goals, worries, or just where you're at right now.",
  messageHintCollab:
    "Tell us about your idea. What are you working on and how do you think we could work together?",
  messageHintGeneral: "How can we help?",
  sendButton: "Send message",
  privacyNote: "We respect your privacy. Your details are never shared or sold.",
  successTitle: "Message received!",
  successText:
    "We'll get back to you within 48 hours. In the meantime, feel free to explore our student stories or check out the eligibility test.",
  successLink: "Read student stories →",
  seoTitle: "Contact Us | Hubble Bubble",
  seoDescription:
    "Get in touch with Hubble Bubble. Whether you're a student, a partner, or just curious, we'd love to hear from you.",
};

export type ContactCopy = typeof contactPageDefaults;
