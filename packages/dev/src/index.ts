import * as fsp from "node:fs/promises";
import * as path from "node:path";

import type { RsbuildPlugin } from "@rsbuild/core";
import type { MultiStats } from "@rspack/core";

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

export function pluginFramework(): RsbuildPlugin {
  return {
    name: "framework",
    async setup(api) {
      const pkgJSON = JSON.parse(
        await fsp.readFile(path.resolve(process.cwd(), "package.json"), "utf-8")
      );

      const containerName = pkgJSON.name?.replace(/[^\w]/g, "_") as string;
      if (!containerName) {
        throw new Error("A valid package.json 'name' is required.");
      }

      const frameworkPlugin = new FrameworkPlugin(containerName);
      const clientPlugin = new FrameworkClientPlugin(containerName);
      const serverPlugin = new FrameworkServerPlugin(containerName);

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
                    resolve: {
                      conditionNames: ["webpack", "browser", "..."],
                    },
                  },
                },
              },
              // ssr: {
              //   source: {
              //     entry: {
              //       index: "framework/entry.ssr",
              //     },
              //   },
              //   output: {
              //     target: "node",
              //     manifest: true,
              //     distPath: {
              //       root: "dist/ssr",
              //     },
              //   },
              //   tools: {
              //     rspack: {
              //       resolve: {
              //         conditionNames: ["webpack", "node", "..."],
              //       },
              //     },
              //   },
              // },
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
