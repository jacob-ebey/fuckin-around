import * as path from "node:path";

// import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import { Rspack } from "@rsbuild/core";
// import { container } from "@rspack/core";
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
    new ModuleFederationPlugin({
      name: this.containerName + "_client",
      exposes: getExposedClientModules(),
      shareScope: "client",
      shared: {
        react: { singleton: true, shareScope: "client" },
        "react-dom": { singleton: true, shareScope: "client" },
      },
      remotes: {
        [this.containerName + "_client"]: `commonjs ${
          this.containerName + "_client"
        }`,
      },
      runtimePlugins: [require.resolve("./runtime.client.js")],
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
      shared: {
        react: { singleton: true, shareScope: "server" },
        "react-dom": { singleton: true, shareScope: "server" },
      },
      remotes: {
        [this.containerName + "_server"]: `commonjs ${
          this.containerName + "_server"
        }`,
      },
    }).apply(compiler as any);
  }
}

export class FrameworkPlugin {
  apply(compiler: Rspack.Compiler) {}

  handleUseClient(filename: string) {
    clientModules.add(filename);
  }

  handleUseServer(filename: string) {
    serverModules.add(filename);
  }
}
