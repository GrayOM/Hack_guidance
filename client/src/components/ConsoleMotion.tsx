import { useEffect, useRef } from "react";

/**
 * A light, non-interactive layer that makes the analysis console respond to a
 * precise pointer without turning the product into a game interface.
 */
export function ConsoleMotion() {
  const layerRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const readout = readoutRef.current;
    if (!layer || !readout) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = false;
    let frame: number | null = null;
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const renderPointer = () => {
      frame = null;
      layer.style.setProperty("--console-pointer-x", `${pointer.x}px`);
      layer.style.setProperty("--console-pointer-y", `${pointer.y}px`);
      readout.textContent = `${String(Math.round(pointer.x)).padStart(4, "0")} · ${String(Math.round(pointer.y)).padStart(4, "0")}`;
    };

    const syncAvailability = () => {
      enabled = finePointer.matches && !reducedMotion.matches;
      layer.dataset.active = enabled ? "true" : "false";
      if (enabled) renderPointer();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!enabled) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame === null) frame = window.requestAnimationFrame(renderPointer);
    };

    syncAvailability();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    finePointer.addEventListener("change", syncAvailability);
    reducedMotion.addEventListener("change", syncAvailability);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      finePointer.removeEventListener("change", syncAvailability);
      reducedMotion.removeEventListener("change", syncAvailability);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={layerRef} className="console-motion" aria-hidden="true">
      <div className="console-motion__reticle" />
      <div className="console-motion__hud">
        <span>POINTER LINK</span>
        <span ref={readoutRef}>0000 · 0000</span>
      </div>
    </div>
  );
}
