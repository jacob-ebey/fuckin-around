import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

import { pluginFramework } from "@framework/dev";

export default defineConfig({
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
  plugins: [pluginReact(), pluginFramework()],
});
