import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════
//  HYPERSPACE RUSH — OBSIDIAN TRACK v3
//
//  Aesthetic: clean arcs, purposeful geometry, no visual clutter.
//  Sectors are designed for camera drama: real vertigo on drops,
//  genuine banking feel on sweepers, satisfying rhythm overall.
//
//  Y range  : −7 → +8   (14 units total elevation swing)
//  XZ spread: ±24 units
//  Closure  : first point == last point ✓
// ═══════════════════════════════════════════════════════════════

const curvePath = [

  // ── S0: Flat launch ────────────────────────────────────────
   22.0,  0.0,   0.0,
   17.0,  0.0,  -0.5,
   12.0, -0.3,  -2.0,

  // ── S1: Nose-dive — long controlled fall ───────────────────
    7.0, -1.5,  -5.5,
    2.0, -3.5,  -9.5,
   -3.0, -5.5, -13.5,
   -7.5, -6.5, -16.0,   // dark floor

  // ── S2: Canyon sweep — left wall banking ───────────────────
  -12.0, -6.0, -17.5,
  -17.0, -5.0, -16.5,
  -21.0, -3.5, -13.5,
  -23.5, -2.0, -10.0,

  // ── S3: Hairpin rise — sharp turnaround ───────────────────
  -24.0, -0.5,  -6.0,
  -23.5,  1.5,  -2.0,
  -21.5,  3.5,   1.5,
  -17.5,  5.0,   4.5,

  // ── S4: Corkscrew helix — full spiral climb ────────────────
  -13.0,  6.5,   5.5,
   -8.5,  7.5,   4.5,   // apex
   -4.0,  7.0,   2.0,
    0.0,  5.5,  -0.5,
    3.5,  3.5,  -3.0,

  // ── S5: Ridge run — high & fast ───────────────────────────
    6.0,  2.5,  -6.5,
    8.0,  2.0, -11.0,
    9.0,  3.0, -16.0,
    9.5,  4.5, -21.0,
    8.0,  6.0, -25.0,   // ridge apex

  // ── S6: Cliff drop — sheer vertical plunge ─────────────────
    4.5,  4.0, -27.5,
    0.5,  1.0, -28.5,
   -4.0, -2.5, -27.5,
   -7.5, -5.0, -24.5,
   -9.0, -6.5, -20.5,

  // ── S7: Canyon floor slalom — the deepest point ────────────
   -9.5, -7.0, -16.0,
   -8.5, -6.5, -11.5,
   -5.5, -7.0,  -7.5,
   -2.0, -6.5,  -4.5,
    2.0, -7.0,  -2.5,

  // ── S8: Rocket climb — steep exit from the pit ─────────────
    6.0, -5.5,  -1.5,
   10.0, -3.5,  -0.5,
   14.0, -1.0,   0.5,
   17.5,  1.5,   2.5,

  // ── S9: High-orbit banking arc ─────────────────────────────
   21.0,  3.5,   5.5,
   23.5,  5.5,   9.5,
   24.5,  7.0,  14.5,   // highest banked arc
   23.0,  7.5,  19.0,
   19.0,  7.0,  22.5,

  // ── S10: Corkscrew descent ─────────────────────────────────
   14.5,  5.5,  23.5,
    9.5,  3.5,  22.5,
    5.5,  1.5,  19.5,
    3.0, -0.5,  15.5,
    3.5, -1.5,  10.5,

  // ── S11: Final chicane — smooth closure ────────────────────
    5.0, -1.0,   7.0,
    8.5, -0.5,   5.5,
   12.5,  0.0,   4.0,
   16.5,  0.0,   2.5,
   19.5,  0.0,   1.0,
   22.0,  0.0,   0.0,   // ← matches S0 exactly

];

const points = [];
for (let i = 0; i < curvePath.length; i += 3) {
  points.push(new THREE.Vector3(curvePath[i], curvePath[i+1], curvePath[i+2]));
}

const spline = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.4);

export default spline;