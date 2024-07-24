import type {
  FederationRuntimePlugin,
  FederationHost,
} from "@module-federation/enhanced/runtime";
import { loadRemote, preloadRemote } from "@module-federation/enhanced/runtime";

declare global {
  var __webpack_require__: {
    p: string;
    c: Record<string, { exports: unknown }>;
    e: (...args: unknown[]) => Promise<unknown>;
    federation: {
      runtime: FederationHost;
      // initOptions: {
      //   name: string;
      //   remotes: Remote[];
      // };
    };
  };
}

const ogEnsure = __webpack_require__.e;
__webpack_require__.e = async (...args: unknown[]) => {
  const [id] = args as [string | number];
console.log('ensureing')
  if (typeof id === "string" && id.startsWith("fcr:")) {
    const [, remoteId, ...restClientId] = id.split(":");
    const clientId = restClientId.join(":");
    const [exposedId, ...restExportedId] = clientId.split("#");
    const exportedId = restExportedId.join("#");

    console.log("loading remote...", id);
    // await preloadRemote([
    //   {
    //     nameOrAlias: remoteId,
    //   },
    // ]);
    // TODO: This is randomly hanging and IDK why yet

    console.log('loading remoote call', remoteId + exposedId.slice(1));
    const mod = await loadRemote(remoteId + exposedId.slice(1));
    console.log("loaded remote", id);
    __webpack_require__.c[id] = {
      exports: mod,
    };
    return;
  }

  return ogEnsure(...args);
};

export default function (): FederationRuntimePlugin {
  return {
    name: "framework_runtime_client",
    //@ts-ignore
    // createScript(args) {
    //   console.log(args);
    //   //@ts-ignore
    //   console.log('file:/' + __non_webpack_require__.resolve(args.url));
    //   //@ts-ignore
    //   return 'file:/' + __non_webpack_require__.resolve(args.url) as any
    // },
//     fetch(href, init) {
//       const url = new URL(href);
//       if (url.pathname.endsWith("/remote-entry.js")) {
//         url.pathname = url.pathname.replace(
//           /\/remote-entry.js$/,
//           "/mf-manifest.json"
//         );
//       }
// console.log(url);
//       return fetch(url, init);
//     },
  };
}
