const signalNodes = ["node-a", "node-b", "node-c", "node-d", "node-e", "node-f"];
const transitRoutes = ["a-b", "b-f", "e-d", "e-c"];

/** Decorative global layer: conveys an active communications network without competing with task content. */
export function SecurityBackdrop() {
  return (
    <div className="security-backdrop" aria-hidden="true">
      <div className="security-backdrop__matrix" />
      <div className="security-backdrop__mesh" />
      <div className="security-backdrop__trace security-backdrop__trace--one" />
      <div className="security-backdrop__trace security-backdrop__trace--two" />
      {transitRoutes.map((route) => (
        <div key={route} className={`security-backdrop__link security-backdrop__link--${route}`}>
          <span className="security-backdrop__packet security-backdrop__packet--forward" />
          <span className="security-backdrop__packet security-backdrop__packet--ack" />
        </div>
      ))}
      <div className="security-backdrop__scan" />
      <div className="security-backdrop__pulse" />
      {signalNodes.map((node) => (
        <span key={node} className={`security-backdrop__node security-backdrop__node--${node}`}>
          <span className="security-backdrop__node-ring security-backdrop__node-ring--outer" />
          <span className="security-backdrop__node-ring security-backdrop__node-ring--middle" />
          <span className="security-backdrop__node-ring security-backdrop__node-ring--inner" />
          <span className="security-backdrop__node-core" />
        </span>
      ))}
    </div>
  );
}
