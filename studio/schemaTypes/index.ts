import { aboutPage, teamMember } from "./aboutPage";
import { blockContent } from "./blockContent";
import { blogTable, blogTopic, post } from "./blog";
import { homePage } from "./homePage";
import { jobRole } from "./jobRole";
import { contactPage, privacyPage, recruitmentPage, servicesPage, storiesPage, story } from "./pages";
import { siteSettings } from "./siteSettings";
import { richText, styledText } from "./text";
import { university } from "./university";

export const schemaTypes = [
  // Pages (one of each)
  homePage,
  aboutPage,
  servicesPage,
  storiesPage,
  recruitmentPage,
  contactPage,
  privacyPage,
  siteSettings,
  // Collections
  jobRole,
  story,
  teamMember,
  university,
  post,
  blogTopic,
  // Reusable field types
  blogTable,
  blockContent,
  styledText,
  richText,
];
