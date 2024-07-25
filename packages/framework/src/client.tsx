import * as React from "react";

import { createFromReadableStream } from "framework/react-server-dom.client";

function createRemoteContext() {
  const cache = new WeakMap<
    ReadableStream<Uint8Array>,
    React.Usable<React.ReactNode>
  >();
  return {
    getElementForReadableStream(
      readableStream: ReadableStream<Uint8Array>
    ): React.Usable<React.ReactNode> {
      const cached = cache.get(readableStream);
      if (cached) {
        return cached;
      }
      const element = createFromReadableStream(readableStream);
      cache.set(readableStream, element);
      return element;
    },
  };
}

const RemoteContext = React.createContext<null | ReturnType<
  typeof createRemoteContext
>>(null);

export function RemoteContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = React.useMemo(createRemoteContext, []);

  return (
    <RemoteContext.Provider value={ctx}>{children}</RemoteContext.Provider>
  );
}

export type RemoteComponentProps = {
  readableStream: ReadableStream<Uint8Array>;
};

export function RemoteComponent({ readableStream }: RemoteComponentProps) {
  const ctx = React.use(RemoteContext);
  if (!ctx) {
    throw new Error("RemoteComponent must be used within a RemoteContext");
  }

  const remoteComponent = React.use(
    ctx.getElementForReadableStream(readableStream)
  );
  return remoteComponent;
}

const OutletContext = React.createContext<
  Record<"children" | string, React.ReactNode>
>({});

export type OutletProviderProps = {
  children: React.ReactNode;
  outlets: Record<"children" | string, React.ReactNode>;
};

export function OutletProvider({ children, outlets }: OutletProviderProps) {
  return (
    <OutletContext.Provider value={outlets}>{children}</OutletContext.Provider>
  );
}

export function Outlet({ id = "children" }: { id?: string }) {
  return React.use(OutletContext)[id];
}
