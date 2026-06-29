export const Cross = ({ className = "" }) => (
  <span className={"pointer-events-none select-none text-faint " + className}>+</span>
);

export function Tag({ n, children }) {
  return (
    <div className="label flex items-center gap-3 text-muted">
      {n && <span className="text-ink">{n}</span>}
      <span className="h-px w-8 bg-white/20" />
      <span>{children}</span>
    </div>
  );
}

export function Marquee({ items, className = "", sep = "/" }) {
  const row = items.join(`   ${sep}   `) + `   ${sep}   `;
  return (
    <div className={"overflow-hidden " + className}>
      <div className="flex w-max whitespace-nowrap animate-marquee">
        <span className="px-4">{row}{row}</span>
        <span className="px-4">{row}{row}</span>
      </div>
    </div>
  );
}
