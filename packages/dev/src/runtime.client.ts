import type {
  FederationRuntimePlugin,
  FederationHost,
} from "@module-federation/enhanced/runtime";
import { loadRemote } from "@module-federation/runtime";

declare global {
  var __webpack_require__: {
    c: Record<string, { exports: unknown }>;
    e: (...args: unknown[]) => Promise<unknown>;
    federation: { runtime: FederationHost };
  };
}

// setTimeout(() => {
  const ogEnsure = __webpack_require__.e;
  __webpack_require__.e = async (...args: unknown[]) => {
    const [id] = args as [string | number];
    if (typeof id === "string" && id.startsWith("fcr:")) {
      const [, remoteId, ...restClientId] = id.split(":");
      const clientId = restClientId.join(":");
      const [exposedId, ...restExportedId] = clientId.split("#");
      const exportedId = restExportedId.join("#");

      const mod = await loadRemote(remoteId + exposedId.slice(1));
      __webpack_require__.c[id] = {
        exports: mod,
      };
      return;
    }

    return ogEnsure(...args);
  };
// }, 0);

export default function (): FederationRuntimePlugin {
  return {
    name: "framework_runtime_client",
  };
}
