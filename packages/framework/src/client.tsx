import * as React from "react";

import { createFromReadableStream } from "framework/react-server-dom.client";

const RemoteContext = React.createContext({
  cache: new Map<ReadableStream<Uint8Array>, React.ReactNode>(),
  useReadableStreamElement(
    readableStream: ReadableStream<Uint8Array>
  ): React.ReactNode {
    const cached = this.cache.get(readableStream);
    if (cached) {
      return cached;
    }
    const element = createFromReadableStream(readableStream);
    this.cache.set(readableStream, element);
    return element;
  },
});

export type RemoteComponentProps = {
  readableStream: ReadableStream<Uint8Array>;
};

export function RemoteComponent({ readableStream }: RemoteComponentProps) {
  const ctx = React.useContext(RemoteContext);

  return ctx.useReadableStreamElement(readableStream);
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
  return React.useContext(OutletContext)[id];
}
