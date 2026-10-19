import { aboutPage, teamMember } from "./aboutPage";
import { blockContent } from "./blockContent";
import { homePage } from "./homePage";
import { jobRole } from "./jobRole";
import { privacyPage, servicesPage, storiesPage, story } from "./pages";
import { siteSettings } from "./siteSettings";
import { richText, styledText } from "./text";

export const schemaTypes = [
  // Pages (one of each)
  homePage,
  aboutPage,
  servicesPage,
  storiesPage,
  privacyPage,
  siteSettings,
  // Collections
  jobRole,
  story,
  teamMember,
  // Reusable field types
  blockContent,
  styledText,
  richText,
];
