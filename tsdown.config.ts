import { defineConfig } from "tsdown";

const env = {
  NODE_ENV: "production",
};

export default defineConfig({
  entry: {
    index: "src/index.ts",
    entry: "src/entry.ts",
    "daemon-cli": "src/cli/daemon-cli.ts",
    "warning-filter": "src/infra/warning-filter.ts",
    extensionAPI: "src/extensionAPI.ts",
    "llm-slug-generator": "src/hooks/llm-slug-generator.ts",
    "plugin-sdk/index": "src/plugin-sdk/index.ts",
    "plugin-sdk/account-id": "src/plugin-sdk/account-id.ts",
    // Use dynamic importing for glob-based entries if needed,
    // but tsdown supports glob patterns in the entry object.
    "bundled/*": "src/hooks/bundled/*/handler.ts",
  },
  env,
  clean: true,
  platform: "node",
  outputOptions: {
    entryFileNames: "[name].mjs",
    chunkFileNames: "chunk-[hash].mjs",
  },
});
