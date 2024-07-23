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
          // ssrEntry: "/remote-entry.js",
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
