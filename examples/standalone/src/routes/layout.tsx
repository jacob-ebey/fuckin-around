export function Component({ children }: { children?: React.ReactNode }) {
  return (
    <div>
      <h1>Layout A</h1>
      {children}
    </div>
  );
}
