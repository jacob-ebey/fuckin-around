import { RemoteComponent } from "framework/client.internal";

import { cleanRemoteName, isTextComponentContentType } from "framework/utils";

export type FrameworkRemote = {
  base: string;
  browserEntry: string;
  ssrEntry?: string;
};

declare global {
  var __FRAMEWORK_REMOTES__: Record<string, FrameworkRemote>;
}

const remotes = __FRAMEWORK_REMOTES__;

export type RemoteRouteProps = {
  remote: string;
  src: string;
};

export async function RemoteRoute({ remote, src }: RemoteRouteProps) {
  const config = remotes[cleanRemoteName(remote)];
  if (!config) {
    throw new Error(`No remote found for ${remote}`);
  }

  const url = new URL(src, config.base);
  url.pathname += ".data";
  const response = await fetch(url, {
    headers: {
      Accept: "text/x-component",
    },
  });
  if (!isTextComponentContentType(response.headers.get("content-type"))) {
    throw new Error("Invalid content type");
  }
  if (!response.body) {
    throw new Error("No body");
  }

  return <RemoteComponent readableStream={response.body} />;
}
