import { useLocation } from "wouter";

const signalNodes = [
  { id: "node-a", code: "EDGE-07" },
  { id: "node-b", code: "IDX-12", defenseTarget: true },
  { id: "node-c", code: "LOG-31" },
  { id: "node-d", code: "RANK-04", defenseTarget: true },
  { id: "node-e", code: "CORE-00", defenseTarget: true },
  { id: "node-f", code: "CERT-50" },
  { id: "node-g", code: "INTR-66", kind: "hacker" },
];
const transitRoutes = [
  { id: "a-e" }, { id: "e-b" }, { id: "e-c" }, { id: "e-d" }, { id: "b-f" }, { id: "c-d" }, { id: "a-b" },
  { id: "g-e", intrusion: true }, { id: "g-b", intrusion: true }, { id: "g-d", intrusion: true },
];
const focusByPath: Record<string, string> = {
  "/": "node-e",
  "/problems": "node-b",
  "/records": "node-c",
  "/ranking": "node-d",
  "/certificate": "node-f",
  "/me": "node-c",
  "/account/password": "node-e",
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
        <div key={route.id} className={`security-backdrop__link security-backdrop__link--${route.id}`}>
          <span className={`security-backdrop__packet ${route.intrusion ? "security-backdrop__packet--intrusion" : "security-backdrop__packet--forward"}`} />
          <span className={`security-backdrop__packet ${route.intrusion ? "security-backdrop__packet--defense" : "security-backdrop__packet--ack"}`} />
        </div>
      ))}
      <div className="security-backdrop__scan" />
      <div className="security-backdrop__pulse" />
      {signalNodes.map((node) => (
        <span key={node.id} className={`security-backdrop__node security-backdrop__node--${node.id} ${node.kind === "hacker" ? "security-backdrop__node--hacker" : ""} ${node.defenseTarget ? "security-backdrop__node--defense-target" : ""} ${activeNode === node.id ? "is-active" : ""}`}>
          <span className="security-backdrop__node-ring security-backdrop__node-ring--outer" />
          <span className="security-backdrop__node-ring security-backdrop__node-ring--middle" />
          <span className="security-backdrop__node-ring security-backdrop__node-ring--inner" />
          <span className="security-backdrop__node-core" />
          <span className="security-backdrop__node-arrival" />
          <span className="security-backdrop__node-defense" />
          <span className="security-backdrop__node-code">{node.code}</span>
        </span>
      ))}
    </div>
  );
}
