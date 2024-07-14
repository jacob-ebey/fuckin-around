import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/bootstrap.browser.ts",
      "src/bootstrap.ssr.ts",
      "src/entry.browser.ts",
      "src/entry.ssr.ts",
    ],
    format: "esm",
  },
  {
    entry: [
      "src/react-dom.server.node.ts",
      "src/react-dom.server.web.ts",
      "src/react-server-dom.client.node.ts",
      "src/react-server-dom.client.web.ts",
      "src/react-server-dom.server.node.ts",
      "src/react-server-dom.server.web.ts",
      "src/runtime.client.ts",
      "src/runtime.server.ts",
      "src/server.tsx",
      "src/ssr.ts",
    ],
    format: ["cjs", "esm"],
    dts: true,
    clean: false,
  },
]);
