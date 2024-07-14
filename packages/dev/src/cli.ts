import arg from "arg";
import type { RsbuildMode, RsbuildPlugin } from "@rsbuild/core";
import { createRsbuild, loadConfig } from "@rsbuild/core";
import { clientModules, serverModules } from "./plugins";

const cwd = process.cwd();

export async function run() {
  const args = arg(
    {
      "--mode": String,
    },
    {
      argv: process.argv.slice(2),
    }
  );

  const command = args._[0] || "dev";

  if (!["build", "dev"].includes(command)) {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }

  let loadedConfig: Awaited<ReturnType<typeof loadConfig>>;
  try {
    loadedConfig = await loadConfig();
  } catch (error) {
    if (process.env.DEBUG) {
      console.error(error);
    }
    console.error("Failed to load rsbuild config");
    process.exit(1);
  }

  const rsbuildConfig = loadedConfig.content;
  let plugin = rsbuildConfig.plugins?.find(
    (plugin) =>
      plugin &&
      typeof plugin === "object" &&
      "name" in plugin &&
      plugin.name === "framework"
  ) as RsbuildPlugin | undefined;
  if (!plugin) {
    const { pluginFramework } = await import("./index");
    plugin = pluginFramework();
    rsbuildConfig.plugins = rsbuildConfig.plugins ?? [];
    rsbuildConfig.plugins.push(plugin);
  }

  const rsbuild = await createRsbuild({ cwd, rsbuildConfig });

  const mode = (args["--mode"] ||
    (command === "build" ? "production" : "development")) as RsbuildMode;

  switch (command) {
    case "build":
      let previousClientCount: number;
      let previousServerCount: number;
      do {
        previousClientCount = clientModules.size;
        previousServerCount = serverModules.size;

        await rsbuild.build({ mode });
      } while (
        previousClientCount !== clientModules.size ||
        previousServerCount !== serverModules.size
      );
    case "dev":
      break;
  }
}
