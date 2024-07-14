import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

import { pluginFramework } from "@framework/dev";

export default defineConfig({
  plugins: [pluginReact(), pluginFramework()],
});
