//@ts-nocheck
import * as path from "node:path";

import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";
import type { Rspack } from "@rsbuild/core";
import { DefinePlugin } from "@rspack/core";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";

import type { FrameworkRemote } from "framework/remote";
import { cleanRemoteName } from "framework/utils";

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
  constructor(
    private containerName: string,
    private remotes: Record<string, FrameworkRemote>
  ) {}

  apply(compiler: Rspack.Compiler) {
    const libType = compiler.options.output.library?.type;

    const allRemotes = {
      ...Object.fromEntries(
        Object.entries(this.remotes).map(([name, remote]) => [
          `${cleanRemoteName(name)}_client`,
          libType
            ? `${cleanRemoteName(name)}_client@${remote.ssrEntry}`
            : `${cleanRemoteName(name)}_client@${remote.browserEntry}`,
        ])
      ),
      // [this.containerName + "_client"]: libType
      //   ? `${this.containerName}_client@${this.remotes[Object.keys(this.remotes)[0]].ssrEntry}`
      //   : `${this.containerName}_client@${this.remotes[Object.keys(this.remotes)[0]].browserEntry}`,
    };
    console.log(allRemotes)
    new ModuleFederationPlugin({
      name: this.containerName + "_client",
      exposes: getExposedClientModules(),
      library: {
        type: libType ? 'commonjs-module' : 'var',
        name: this.containerName + "_client"
      },
      shareScope: "client",
      filename: "remote-entry.js",
      dts: false,
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
        "react-server-dom-webpack": { singleton: true },
        "framework/client": {
          singleton: true,
          version: "0.0.0",
        },
        "framework/react-server-dom.client": {
          version: "0.0.0",
        },
      },
      remoteType: 'script',
      remotes: { ...allRemotes },
      runtimePlugins: [require.resolve("./runtime.client.js")],
    }).apply(compiler as any);

    // new RspackCircularDependencyPlugin({
    //   // `onStart` is called before the cycle detection starts
    //   onStart({ compilation }: any) {
    //     console.log("start detecting rspack modules cycles");
    //   },
    //   // `onDetected` is called for each module that is cyclical
    //   onDetected({ paths, compilation }: any) {
    //     // `paths` will be an Array of the relative module paths that make up the cycle
    //     compilation.errors.push(new Error(paths.join(" -> ")));
    //   },
    //   // `onEnd` is called before the cycle detection ends
    //   onEnd({ compilation }: any) {
    //     console.log("end detecting rspack modules cycles");
    //   },
    // }).apply(compiler as any);
  }
}

export class FrameworkServerPlugin {
  constructor(
    private containerName: string,
    private remotes: Record<string, FrameworkRemote>
  ) {}


  apply(compiler: Rspack.Compiler) {
    new ModuleFederationPlugin({
      name: this.containerName + "_server",
      exposes: getExposedServerModules(),
      shareScope: "server",
      filename: 'server-remote.js',
      remoteType: 'script',
      dts: false,
      shared: {
        react: { singleton: true, shareScope: "server" },
        "react-dom": { singleton: true, shareScope: "server" },
      },
      // runtimePlugins: [require.resolve('./runtime.server.js')],
      remotes: {
        [this.containerName + "_server"]: `promise new Promise(() => {
          import(${JSON.stringify(this.containerName + "_server")});
        })`,
      },
    }).apply(compiler as any);

    new DefinePlugin({
      __FRAMEWORK_REMOTES__: JSON.stringify(this.remotes),
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

const BASE_ERROR = "Circular dependency detected:\r\n";
const PluginTitle = "RspackCircularDependencyPlugin";

const normalizePath = (path: string) => path.replace(/^\.\//, "");

class RspackCircularDependencyPlugin {
  options: any;
  constructor(options: any = {}) {
    /** @type {FullOptions} */
    this.options = {
      exclude: options.exclude ?? /$^/,
      include: options.include ?? /.*/,
      failOnError: options.failOnError ?? false,
      allowAsyncCycles: options.allowAsyncCycles ?? false,
      onStart: options.onStart,
      onDetected: options.onDetected,
      onEnd: options.onEnd,
    };
  }

  /**
   * @param {import('@rspack/core').Compiler} compiler
   */
  apply(compiler: any) {
    compiler.hooks.afterCompile.tap(PluginTitle, (compilation: any) => {
      this.options.onStart?.({ compilation });
      const stats = compilation.getStats().toJson();

      /** @type {ModuleMap} */
      const modulesById = Object.fromEntries(
        (stats.modules ?? [])
          .filter(
            (module: any) =>
              !module.orphan &&
              !!module.id &&
              module.name.match(this.options.include) &&
              !module.name.match(this.options.exclude)
          )
          .map((module: any) => [module.id, module])
      );

      for (const module of Object.keys(modulesById)) {
        const maybeCyclicalPathsList = this.isCyclic(
          module,
          module,
          modulesById
        );

        if (maybeCyclicalPathsList) {
          if (this.options.onDetected) {
            try {
              this.options.onDetected({
                paths: maybeCyclicalPathsList,
                compilation,
              });
            } catch (/** @type {any} **/ err) {
              compilation.errors.push(err);
            }
          } else {
            // mark warnings or errors on rspack compilation
            const message = BASE_ERROR.concat(
              maybeCyclicalPathsList.join(" -> ")
            );
            if (this.options.failOnError) {
              compilation.errors.push(new Error(message));
            } else {
              compilation.warnings.push({ message, formatted: message });
            }
          }
        }
      }

      this.options.onEnd?.({ compilation });
    });
  }

  isCyclic(
    initialModule: string,
    currentModule: string,
    modulesById: any,
    seenModules: any = {}
  ): string[] | undefined {
    // Add the current module to the seen modules cache
    const moduleName = modulesById[currentModule].name;
    seenModules[currentModule] = true;

    // Iterate over the current modules dependencies
    for (const reason of modulesById[currentModule].reasons ?? []) {
      const reasonModule = reason.moduleId
        ? modulesById[reason.moduleId]
        : undefined;

      if (!reasonModule?.id) {
        continue;
      }

      if (
        this.options.allowAsyncCycles &&
        reason.type?.match(/dynamic import|import\(\)/)
      ) {
        continue;
      }

      if (reasonModule.id in seenModules) {
        if (reasonModule.id === initialModule) {
          // Initial module has a circular dependency
          return [normalizePath(reasonModule.name), normalizePath(moduleName)];
        }
        // Found a cycle, but not for this module
        continue;
      }

      const maybeCyclicalPathsList = this.isCyclic(
        initialModule,
        reasonModule.id,
        modulesById,
        seenModules
      );

      if (maybeCyclicalPathsList) {
        return [...maybeCyclicalPathsList, normalizePath(moduleName)];
      }
    }
  }
}
