import * as path from "node:path";

import type { Rspack } from "@rsbuild/core";
import { DefinePlugin } from "@rspack/core";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

declare global {
  var clientModules: Set<string>;
  var serverModules: Set<string>;
}

global.clientModules = global.clientModules ?? new Set<string>();
global.serverModules = global.serverModules ?? new Set<string>();

export const clientModules = global.clientModules;
export const serverModules = global.serverModules;

function getExposedId(filename: string) {
  const relative = path.relative(process.cwd(), filename);
  return (
    "./" + relative.replace(/^\.+/, "").replace(/\\/g, "/").replace(/^\//, "")
  );
}

function getExposedClientModules() {
  const exposed: Record<string, string> = {};
  for (const filename of clientModules) {
    exposed[getExposedId(filename)] = filename;
  }
  return exposed;
}

function getExposedServerModules() {
  const exposed: Record<string, string> = {};
  for (const filename of serverModules) {
    exposed[getExposedId(filename)] = filename;
  }
  return exposed;
}

const js = String.raw;

export class FrameworkClientPlugin {
  constructor(private containerName: string) {}

  apply(compiler: Rspack.Compiler) {
    const libType = compiler.options.output.library?.type;

    const allRemotes = {
      [this.containerName + "_client"]: libType
        ? `${libType} ./remote-entry.js`
        : `${this.containerName}_client@/remote-entry.js`,
    };

    new ModuleFederationPlugin({
      name: this.containerName + "_client",
      exposes: getExposedClientModules(),
      shareScope: "client",
      filename: "remote-entry.js",
      dts: false,
      manifest: false,
      shared: {
        react: { singleton: true, shareScope: "client" },
        "react-dom": { singleton: true, shareScope: "client" },
      },
      remotes: { ...allRemotes },
      runtimePlugins: [require.resolve("./runtime.client.js")],
    }).apply(compiler as any);

    // TODO: collect all remotes from other plugins.

    new DefinePlugin({
      __FRAMEWORK_REMOTES__: JSON.stringify(allRemotes),
    }).apply(compiler as any);
  }
}

export class FrameworkServerPlugin {
  constructor(private containerName: string) {}

  apply(compiler: Rspack.Compiler) {
    new ModuleFederationPlugin({
      name: this.containerName + "_server",
      exposes: getExposedServerModules(),
      shareScope: "server",
      dts: false,
      shared: {
        react: { singleton: true, shareScope: "server" },
        "react-dom": { singleton: true, shareScope: "server" },
      },
      remotes: {
        [this.containerName + "_server"]: `promise new Promise(() => {
          import(${JSON.stringify(this.containerName + "_server")});
        })`,
      },
    }).apply(compiler as any);
  }
}

export class FrameworkPlugin {
  constructor(private containerName: string) {}

  apply(compiler: Rspack.Compiler) {}

  handleUseClient(filename: string) {
    clientModules.add(filename);
  }

  handleUseServer(filename: string) {
    serverModules.add(filename);
  }
}