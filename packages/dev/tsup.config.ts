import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/cli.ts",
      "src/index.ts",
      "src/plugins.ts",
      "src/rsc-loader.ts",
      "src/runtime.client.ts",
    ],
    dts: true,
    external: ["./plugins.js", "./rsc-loader.js", "./runtime.client.js"],
  },
]);
