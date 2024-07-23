//@ts-nocheck

import * as fsp from "node:fs/promises";
import * as path from "node:path";

import type { RsbuildPlugin } from "@rsbuild/core";

import type { FrameworkRemote } from "framework/remote";
import { cleanRemoteName } from "framework/utils";

import {
  FrameworkPlugin,
  FrameworkClientPlugin,
  FrameworkServerPlugin,
} from "./plugins.js";

async function resolveFile(base: string, filename: string, exts: string[]) {
  for (const ext of exts) {
    const file = path.resolve(base, filename + ext);
    if (
      await fsp
        .stat(file)
        .then((r) => r.isFile())
        .catch(() => false)
    ) {
      return file;
    }
  }
}

export type PluginFrameworkOptions = {
  /**
   * The base name of the containers for the build.
   * @default package.json 'name'
   */
  containerName?: string;
  remotes?: Record<string, FrameworkRemote>;
};

export function pluginFramework({
  containerName,
  remotes: _remotes,
}: PluginFrameworkOptions = {}): RsbuildPlugin {
  return {
    name: "framework",
    async setup(api) {
      if (!containerName) {
        const pkgJSON = JSON.parse(
          await fsp.readFile(
            path.resolve(process.cwd(), "package.json"),
            "utf-8"
          )
        );

        containerName = pkgJSON.name;
      }
      if (!containerName) {
        throw new Error("A valid package.json 'name' is required.");
      }
      containerName = cleanRemoteName(containerName);

      const remotes = Object.fromEntries(
        Object.entries(_remotes ?? {}).map(
          ([name, remote]) => [cleanRemoteName(name), remote] as const
        )
      );

      const frameworkPlugin = new FrameworkPlugin(containerName);
      const clientPlugin = new FrameworkClientPlugin(containerName, remotes);
      const serverPlugin = new FrameworkServerPlugin(containerName, remotes);

      const serverEntry = await resolveFile(process.cwd(), "src/entry.server", [
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
      ]);

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) =>
        mergeRsbuildConfig(
          {
            environments: {
              browser: {
                source: {
                  entry: {
                    index: "framework/entry.browser",
                  },
                },
                output: {
                  target: "web",
                  sourceMap: { js: false },
                  distPath: {
                    root: "dist/browser",
                  },
                },
                tools: {
                  rspack: {
                    output: {
                      publicPath: "auto",
                    },
                    resolve: {
                      conditionNames: ["browser", "..."],
                    },
                  },
                },
              },
              ssr: {
                source: {
                  entry: {
                    index: "framework/entry.ssr",
                  },
                },
                output: {
                  target: "node",
                  manifest: true,
                  distPath: {
                    root: "dist/ssr",
                  },
                },
                tools: {
                  rspack: {
                    resolve: {
                      conditionNames: ["webpack", "node", "..."],
                    },
                  },
                },
              },
              server: {
                source: {
                  entry: serverEntry
                    ? {
                        index: serverEntry,
                      }
                    : undefined,
                },
                output: {
                  target: "node",
                  distPath: {
                    root: "dist/server",
                  },
                },
                tools: {
                  rspack: {
                    resolve: {
                      conditionNames: [
                        "react-server",
                        "webpack",
                        "node",
                        "...",
                      ],
                    },
                  },
                },
              },
            },
          },
          config
        )
      );

      api.onBeforeCreateCompiler(({ bundlerConfigs, environments }) => {
        const clientEnvs = ["browser", "ssr"];
        const serverEnvs = ["server"];
        for (const env of clientEnvs) {
          const environment = environments[env];
          if (!environment) continue;
          const bundlerConfig = bundlerConfigs[environment.index];
          bundlerConfig.plugins ??= [];
          bundlerConfig.plugins.push(clientPlugin);
        }
        for (const env of serverEnvs) {
          const environment = environments[env];
          if (!environment) continue;
          const bundlerConfig = bundlerConfigs[environment.index];
          bundlerConfig.plugins ??= [];
          bundlerConfig.plugins.push(serverPlugin);
        }
      });

      api.modifyRspackConfig((config, { mergeConfig }) =>
        mergeConfig(config, {
          plugins: [frameworkPlugin],
          module: {
            rules: [
              {
                enforce: "post",
                test: [/\.(j|t|mj|cj)sx?$/i],
                exclude: /node_modules/,
                use: [
                  {
                    loader: require.resolve("./rsc-loader.js"),
                    options: {
                      containerName,
                    },
                  },
                ],
              },
            ],
          },
        })
      );
    },
  };
}
