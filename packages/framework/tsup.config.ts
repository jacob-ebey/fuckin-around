import { defineConfig } from "tsup";

const external = [
  "@framework/virtual-remotes",
  "framework",
  /^framework\/.*/,
  "react",
  /^react\/.*/,
  "react-dom",
  /^react\-dom\/.*/,
  /^react\-server\-dom\-webpack\/.*/,
];

export default defineConfig([
  // assets that are loaded by webpack
  {
    entry: ["src/entry.browser.ts", "src/entry.ssr.ts"],
    format: "esm",
    platform: "neutral",
    external,
  },
  // platform-neutral assets
  {
    entry: [
      "src/runtime.client.ts",
      "src/runtime.server.ts",
      "src/client.tsx",
      "src/client.internal.ts",
      "src/remote.tsx",
      "src/server.tsx",
      "src/ssr.tsx",
      "src/utils.ts",
    ],
    format: ["cjs", "esm"],
    platform: "neutral",
    external,
    dts: true,
    clean: false,
  },
  // browser / worker assets
  {
    entry: [
      "src/react-dom.server.web.ts",
      "src/react-server-dom.client.web.ts",
      "src/react-server-dom.server.web.ts",
    ],
    format: ["esm"],
    platform: "neutral",
    external,
    dts: true,
    clean: false,
  },
  // node assets
  {
    entry: [
      "src/react-dom.server.node.ts",
      "src/react-server-dom.client.node.ts",
      "src/react-server-dom.server.node.ts",
    ],
    format: ["cjs", "esm"],
    platform: "node",
    external,
    dts: true,
    clean: false,
  },
]);
