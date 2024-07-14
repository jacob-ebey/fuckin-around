import * as path from "node:path";

import type { Rspack } from "@rsbuild/core";

import {
  FrameworkPlugin,
  FrameworkClientPlugin,
  FrameworkServerPlugin,
} from "./plugins.js";

function getId(
  containerName: string,
  filename: string,
  directive: "use client" | "use server"
) {
  const relative = path.relative(process.cwd(), filename);
  return `fcr:${containerName}_${directive.replace("use ", "")}:./${relative
    .replace(/^\.+/, "")
    .replace(/\\/g, "/")
    .replace(/^\//, "")}`;
}

async function loader(this: Rspack.LoaderContext, content: string, map: any) {
  const done = this.async();
  const resourcePath = this.resourcePath;
  const { containerName } = this.getOptions() as { containerName?: string };
  if (!containerName) {
    return done(new Error("package.json 'name' is required."));
  }

  const frameworkPlugin = this._compiler.options.plugins.find(
    (plugin) => plugin instanceof FrameworkPlugin
  ) as FrameworkPlugin | undefined;
  if (!frameworkPlugin) return done(null, content, map);

  const isClientBuild = this._compiler.options.plugins.some(
    (plugin) => plugin instanceof FrameworkClientPlugin
  );
  const isServerBuild =
    !isClientBuild &&
    this._compiler.options.plugins.some(
      (plugin) => plugin instanceof FrameworkServerPlugin
    );

  if (!isClientBuild && !isServerBuild) return done(null, content, map);
  if (isClientBuild && isServerBuild) {
    return done(
      new Error(
        "Invalid build configuration. Both client and server builds are enabled."
      )
    );
  }

  try {
    const rsc = await import("unplugin-rsc");

    if (isClientBuild) {
      const transformed = rsc.clientTransform(content, resourcePath, {
        id(filename, directive) {
          switch (directive) {
            case "use server":
              frameworkPlugin.handleUseServer(filename);
              break;
          }

          return getId(containerName, filename, directive);
        },
        importFrom: "framework/runtime.client",
        importServer: "registerServerReference",
      });

      return done(null, transformed.code, transformed.map);
    }

    const transformed = rsc.serverTransform(content, resourcePath, {
      id(filename, directive) {
        switch (directive) {
          case "use client":
            frameworkPlugin.handleUseClient(filename);
            break;
          case "use server":
            frameworkPlugin.handleUseServer(filename);
            break;
        }
        return getId(containerName, filename, directive);
      },
      importFrom: "react-server-dom-webpack/server",
      importClient: "registerClientReference",
      importServer: "registerServerReference",
    });

    return done(null, transformed.code, transformed.map);
  } catch (error) {
    return done(null, content, map);
  }
}

module.exports = loader;
