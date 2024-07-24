import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

import { pluginFramework } from "@framework/dev";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginFramework({
      remotes: {
        "@example/host": {
          base: "http://localhost:3000",
          browserEntry: "http://localhost:3000/remote-entry.js",
          ssrEntry: "http://localhost:3000/ssr/remote-entry.js",
        },
        "@example/marketing": {
          base: "http://localhost:3001",
          browserEntry: "http://localhost:3001/remote-entry.js",
          ssrEntry: "http://localhost:3001/ssr/remote-entry.js",
        },
      },
    }),
  ],
  environments: {
    browser: {
      output: {
        minify: false,
      },
    },
    ssr: {
      output: {
        minify: false,
      },
    },
    server: {
      output: {
        minify: false,
      },
    },
  },
});
