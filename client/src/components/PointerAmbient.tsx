import { useEffect, useRef } from "react";

/** Ambient pointer response without a cursor-attached HUD, label, or reticle. */
export function PointerAmbient() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let enabled = false;
    let frame: number | null = null;
    let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const renderGlow = () => {
      frame = null;
      layer.style.setProperty("--ambient-pointer-x", `${pointer.x}px`);
      layer.style.setProperty("--ambient-pointer-y", `${pointer.y}px`);
    };

    const syncAvailability = () => {
      enabled = finePointer.matches && !reducedMotion.matches && window.innerWidth >= 640;
      layer.dataset.active = enabled ? "true" : "false";
      if (enabled) renderGlow();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!enabled) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (frame === null) frame = window.requestAnimationFrame(renderGlow);
    };

    syncAvailability();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", syncAvailability);
    finePointer.addEventListener("change", syncAvailability);
    reducedMotion.addEventListener("change", syncAvailability);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", syncAvailability);
      finePointer.removeEventListener("change", syncAvailability);
      reducedMotion.removeEventListener("change", syncAvailability);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={layerRef} className="pointer-ambient" aria-hidden="true" />;
}
