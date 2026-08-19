const signalNodes = ["node-a", "node-b", "node-c", "node-d", "node-e", "node-f"];

/** Decorative global layer: conveys an active network without competing with task content. */
export function SecurityBackdrop() {
  return (
    <div className="security-backdrop" aria-hidden="true">
      <div className="security-backdrop__matrix" />
      <div className="security-backdrop__trace security-backdrop__trace--one" />
      <div className="security-backdrop__trace security-backdrop__trace--two" />
      <div className="security-backdrop__scan" />
      <div className="security-backdrop__pulse" />
      {signalNodes.map((node) => <span key={node} className={`security-backdrop__node security-backdrop__node--${node}`} />)}
    </div>
  );
}
