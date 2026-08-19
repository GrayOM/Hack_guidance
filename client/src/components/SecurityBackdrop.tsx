import { useLocation } from "wouter";

const signalNodes = [
  { id: "node-a", code: "EDGE-07" },
  { id: "node-b", code: "IDX-12" },
  { id: "node-c", code: "LOG-31" },
  { id: "node-d", code: "RANK-04" },
  { id: "node-e", code: "CORE-00" },
  { id: "node-f", code: "CERT-50" },
  { id: "node-g", code: "INTR-66", kind: "hacker" },
];
const transitRoutes = ["a-e", "e-b", "e-c", "e-d", "b-f", "c-d", "a-b", "g-e"];
const focusByPath: Record<string, string> = {
  "/": "node-e",
  "/problems": "node-b",
  "/records": "node-c",
  "/ranking": "node-d",
  "/certificate": "node-f",
};

/** Decorative global layer: conveys an active communications network without competing with task content. */
export function SecurityBackdrop() {
  const [location] = useLocation();
  const activeNode = focusByPath[location] ?? "node-e";

  return (
    <div className="security-backdrop" data-active-node={activeNode} aria-hidden="true">
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
        <span key={node.id} className={`security-backdrop__node security-backdrop__node--${node.id} ${node.kind === "hacker" ? "security-backdrop__node--hacker" : ""} ${activeNode === node.id ? "is-active" : ""}`}>
          <span className="security-backdrop__node-ring security-backdrop__node-ring--outer" />
          <span className="security-backdrop__node-ring security-backdrop__node-ring--middle" />
          <span className="security-backdrop__node-ring security-backdrop__node-ring--inner" />
          <span className="security-backdrop__node-core" />
          <span className="security-backdrop__node-code">{node.code}</span>
        </span>
      ))}
    </div>
  );
}
