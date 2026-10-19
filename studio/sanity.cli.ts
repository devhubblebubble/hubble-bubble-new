import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "qstbrsll",
    dataset: "production",
  },
  deployment: {
    // Sanity keeps the hosted editor on the latest Studio version automatically.
    autoUpdates: true,
  },
});
