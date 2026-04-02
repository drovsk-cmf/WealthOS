"use client";

import { useRef, useEffect, useCallback } from "react";

/* ================================================================== */
/*  E23 — Onie Orb: Canvas 2D + Simplex Noise                        */
/*  Ref: docs/ONIE-ORB-SPEC.md                                       */
/*  Replaces all loaders in the app.                                  */
/* ================================================================== */

export type OnieState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "alert"
  | "positive";

export interface OnieLoaderProps {
  size?: "sm" | "md" | "lg";
  state?: OnieState;
  /** Optional label shown below the orb */
  label?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Simplex noise (inline, ~50 lines, no dependencies)                */
/* ------------------------------------------------------------------ */

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);

// Initialize permutation table (deterministic seed for consistency)
(() => {
  const v = new Uint8Array(256);
  for (let i = 0; i < 256; i++) v[i] = i;
  // Simple deterministic shuffle (seeded with golden ratio)
  let seed = 0x9e3779b9;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [v[i], v[j]] = [v[j], v[i]];
  }
  for (let i = 0; i < 512; i++) {
    perm[i] = v[i & 255];
    permMod12[i] = perm[i] % 12;
  }
})();

const grad2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

function sn(x: number, y: number): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let a = 0, b = 0, c = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) { t0 *= t0; const g = grad2[permMod12[ii + perm[jj]]]; a = t0 * t0 * (g[0] * x0 + g[1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) { t1 *= t1; const g = grad2[permMod12[ii + i1 + perm[jj + j1]]]; b = t1 * t1 * (g[0] * x1 + g[1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) { t2 *= t2; const g = grad2[permMod12[ii + 1 + perm[jj + 1]]]; c = t2 * t2 * (g[0] * x2 + g[1] * y2); }
  return 70 * (a + b + c);
}

/* ------------------------------------------------------------------ */
/*  State parameters and palettes                                     */
/* ------------------------------------------------------------------ */

interface StateParams {
  speed: number;
  deform: number;
  breathe: number;
  turb: number;
  contract: number;
  spasm: number;
  spasmF: number;
  cShift: number;
}

const STATE_PARAMS: Record<OnieState, StateParams> = {
  idle:       { speed: 0.3,  deform: 0.6,  breathe: 0.025, turb: 0.8,  contract: 0,    spasm: 0,     spasmF: 0,   cShift: 0 },
  listening:  { speed: 0.12, deform: 0.4,  breathe: 0.05,  turb: 0.5,  contract: 0.25, spasm: 0,     spasmF: 0,   cShift: 0 },
  processing: { speed: 1.7,  deform: 1.05, breathe: 0.015, turb: 1.2,  contract: 0,    spasm: 0.028, spasmF: 1.6, cShift: 1 },
  speaking:   { speed: 0.35, deform: 0.65, breathe: 0.012, turb: 0.85, contract: 0,    spasm: 0.028, spasmF: 1.6, cShift: 0 },
  alert:      { speed: 0.7,  deform: 1.0,  breathe: 0.01,  turb: 1.2,  contract: 0,    spasm: 0,     spasmF: 0,   cShift: 0 },
  positive:   { speed: 0.35, deform: 0.65, breathe: 0.04,  turb: 0.75, contract: 0,    spasm: 0,     spasmF: 0,   cShift: 0 },
};

type RGB = [number, number, number];

const PALETTES: Record<string, RGB[]> = {
  default:  [[168, 85, 247], [16, 185, 129], [192, 132, 252], [52, 211, 153], [245, 158, 11]],
  listening:[[120, 60, 220], [14, 160, 110], [160, 100, 230], [40, 180, 130], [200, 130, 10]],
  alert:    [[220, 20, 20],  [180, 0, 0],    [255, 50, 30],   [200, 10, 10],  [160, 0, 20]],
  positive: [[0, 230, 120],  [16, 255, 160], [50, 240, 140],  [0, 210, 100],  [80, 255, 180]],
};

const CORE_COLORS: Record<string, RGB> = {
  default:  [91, 33, 182],
  listening:[60, 20, 150],
  alert:    [100, 0, 0],
  positive: [0, 80, 50],
};

const CYCLE_PALETTE: RGB[] = [
  [168, 85, 247], [16, 185, 129], [192, 132, 252], [52, 211, 153], [245, 158, 11],
  [190, 100, 255], [60, 240, 170], [255, 180, 20], [120, 60, 220], [80, 255, 180],
];

function getPaletteKey(state: OnieState): string {
  if (state === "alert") return "alert";
  if (state === "positive") return "positive";
  if (state === "listening") return "listening";
  return "default";
}

const SIZE_MAP = {
  sm: { canvas: 120, display: 44, voals: 3, blur: 3, pts: 48 },
  md: { canvas: 240, display: 88, voals: 5, blur: 4, pts: 60 },
  lg: { canvas: 360, display: 160, voals: 5, blur: 6, pts: 72 },
};

/* ------------------------------------------------------------------ */
/*  Interpolation helpers                                             */
/* ------------------------------------------------------------------ */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function OnieLoader({
  size = "md",
  state = "idle",
  label,
  className = "",
}: OnieLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<OnieState>(state);
  const animRef = useRef<number>(0);

  // Mutable animation state (persisted across frames, not in React state)
  const animState = useRef({
    time: 0,
    params: { ...STATE_PARAMS[state] },
    colors: [...(PALETTES[getPaletteKey(state)] ?? PALETTES.default)],
    coreColor: [...(CORE_COLORS[getPaletteKey(state)] ?? CORE_COLORS.default)] as RGB,
  });

  // Update target state when prop changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cfg = SIZE_MAP[size];

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = cfg.canvas;
    const cx = w / 2, cy = w / 2, rad = w / 2;
    const target = STATE_PARAMS[stateRef.current];
    const targetPalKey = getPaletteKey(stateRef.current);
    const targetPal = PALETTES[targetPalKey] ?? PALETTES.default;
    const targetCore = CORE_COLORS[targetPalKey] ?? CORE_COLORS.default;
    const st = animState.current;
    const I = 0.03; // interpolation factor

    // Interpolate parameters
    st.params.speed = lerp(st.params.speed, target.speed, I);
    st.params.deform = lerp(st.params.deform, target.deform, I);
    st.params.breathe = lerp(st.params.breathe, target.breathe, I);
    st.params.turb = lerp(st.params.turb, target.turb, I);
    st.params.contract = lerp(st.params.contract, target.contract, I);
    st.params.spasm = lerp(st.params.spasm, target.spasm, I);
    st.params.spasmF = lerp(st.params.spasmF, target.spasmF, I);
    st.params.cShift = lerp(st.params.cShift, target.cShift, I);

    // Interpolate colors
    for (let i = 0; i < 5; i++) {
      const tc = targetPal[i] ?? targetPal[0];
      if (st.params.cShift > 0.01) {
        // Color cycling
        const ci = (st.time * 0.15 + i * 2) % CYCLE_PALETTE.length;
        const ci0 = Math.floor(ci) % CYCLE_PALETTE.length;
        const ci1 = (ci0 + 1) % CYCLE_PALETTE.length;
        const cf = ci - Math.floor(ci);
        const cycled = lerpRGB(CYCLE_PALETTE[ci0], CYCLE_PALETTE[ci1], cf);
        st.colors[i] = lerpRGB(st.colors[i] as RGB, cycled, I * 2);
      } else {
        st.colors[i] = lerpRGB(st.colors[i] as RGB, tc, I);
      }
    }
    st.coreColor = lerpRGB(st.coreColor, targetCore, I);

    st.time += 0.016 * st.params.speed;

    // Clear
    ctx.clearRect(0, 0, w, w);

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.clip();

    // Core gradient
    const coreGrad = ctx.createRadialGradient(
      cx * 0.84, cy * 0.76, 0,
      cx, cy, rad
    );
    const [cr, cg, cb] = st.coreColor;
    coreGrad.addColorStop(0, `rgba(${cr + 40}, ${cg + 20}, ${cb + 40}, 1)`);
    coreGrad.addColorStop(1, `rgba(${cr * 0.3 | 0}, ${cg * 0.3 | 0}, ${cb * 0.3 | 0}, 1)`);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, w, w);

    // Blending mode
    ctx.globalCompositeOperation = "screen";

    const breathScale = 1 + Math.sin(st.time * 2.5) * st.params.breathe;
    const contractScale = 1 - st.params.contract;

    // Draw voais
    const numVoals = cfg.voals;
    const pts = cfg.pts;

    for (let v = 0; v < numVoals; v++) {
      const orbAngle = st.time * (0.25 + v * 0.13);
      const orbDist = rad * (0.2 + 0.08 * Math.sin(st.time * 0.13 + v * 3));
      const ox = cx + Math.cos(orbAngle) * orbDist;
      const oy = cy + Math.sin(orbAngle) * orbDist;

      const spasmMod = st.params.spasm > 0.001
        ? 1 + st.params.spasm * sn(st.time * st.params.spasmF, v * 7.7)
        : 1;

      const voalScale = rad * 1.3 * breathScale * contractScale * spasmMod;
      const noiseScale1 = 0.7 + v * 0.14;
      const noiseScale2 = noiseScale1 * 2;
      const noiseScale3 = noiseScale1 * 0.4;

      ctx.save();
      ctx.filter = `blur(${cfg.blur}px)`;
      ctx.beginPath();

      for (let i = 0; i <= pts; i++) {
        const angle = (i / pts) * Math.PI * 2;
        const lobe = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(angle * 1.3 + v * 0.8)), 1.2);

        const d1 = sn(
          Math.cos(angle) * noiseScale1 + st.time * 0.5,
          Math.sin(angle) * noiseScale1 + v * 3
        ) * st.params.deform * 0.45;

        const d2 = sn(
          Math.cos(angle) * noiseScale2 + st.time * 0.8 + 100,
          Math.sin(angle) * noiseScale2 + v * 5
        ) * st.params.deform * 0.2;

        const d3 = sn(
          Math.cos(angle) * noiseScale3 + st.time * 0.2 + 200,
          Math.sin(angle) * noiseScale3 + v * 11
        ) * st.params.turb * 0.18;

        const r = voalScale * lobe * (1 + d1 + d2);
        const a = angle + d3;
        const px = ox + Math.cos(a) * r;
        const py = oy + Math.sin(a) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.closePath();

      const [vr, vg, vb] = (st.colors[v] ?? st.colors[0]) as RGB;
      const fillGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, voalScale);
      fillGrad.addColorStop(0, `rgba(${vr | 0}, ${vg | 0}, ${vb | 0}, 0.7)`);
      fillGrad.addColorStop(0.6, `rgba(${vr | 0}, ${vg | 0}, ${vb | 0}, 0.25)`);
      fillGrad.addColorStop(1, `rgba(${vr | 0}, ${vg | 0}, ${vb | 0}, 0)`);
      ctx.fillStyle = fillGrad;
      ctx.fill();
      ctx.restore();
    }

    // Reset blending
    ctx.globalCompositeOperation = "source-over";

    // Glass highlight
    const hlGrad = ctx.createRadialGradient(
      cx * 0.7, cy * 0.6, 0,
      cx * 0.7, cy * 0.6, rad * 0.5
    );
    hlGrad.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    hlGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = hlGrad;
    ctx.fillRect(0, 0, w, w);

    ctx.restore();

    animRef.current = requestAnimationFrame(render);
  }, [cfg]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 ${className}`}
      role="status"
      aria-label={label || "Carregando"}
    >
      <canvas
        ref={canvasRef}
        width={cfg.canvas}
        height={cfg.canvas}
        style={{
          width: cfg.display,
          height: cfg.display,
          borderRadius: "50%",
          overflow: "hidden",
        }}
      />
      {label && (
        <p className="text-xs text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

/**
 * Drop-in spinner replacement.
 * Use <OnieLoader size="sm" /> where the old spinner was.
 */
export function OnieSpinner({ className = "" }: { className?: string }) {
  return <OnieLoader size="sm" className={className} />;
}
