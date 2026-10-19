import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "qstbrsll",
    dataset: "production",
  },
  deployment: {
    // Hosted at https://hubblebubble.sanity.studio (created on first deploy).
    appId: "xlp8phc889zq6d6k6zcl3c7q",
    // Sanity keeps the hosted editor on the latest Studio version automatically.
    autoUpdates: true,
  },
});
