import type {
  FederationRuntimePlugin,
  FederationHost,
} from "@module-federation/enhanced/runtime";
import { loadRemote } from "@module-federation/runtime";
import type { Remote } from "@module-federation/runtime/types";

declare global {
  var __webpack_require__: {
    c: Record<string, { exports: unknown }>;
    e: (...args: unknown[]) => Promise<unknown>;
    federation: {
      runtime: FederationHost;
      initOptions: {
        name: string;
        remotes: Remote[];
      };
    };
  };
  var __FRAMEWORK_REMOTES__: Record<string, string>;
}

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

// TODO: I think this can be used in the plugin below somehow to intercep the loading and
// use the commonjs exetneral specified by the value in the __FRAMEWORK_REMOTES__ object
for (const [remote, external] of Object.entries(__FRAMEWORK_REMOTES__)) {
}

export default function (): FederationRuntimePlugin {
  return {
    name: "framework_runtime_client",
  };
}
