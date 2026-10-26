var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/remotion-motion-render.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"), 1);

// src/remotion/stickman/VectorShot.tsx
var import_react = __toESM(require("react"), 1);
var import_remotion2 = require("remotion");

// src/remotion/stickman/lib/motion.ts
var import_remotion = require("remotion");
var easeOut = (frame, start, end, from = 0, to = 1) => (0, import_remotion.interpolate)(frame, [start, end], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: import_remotion.Easing.out(import_remotion.Easing.cubic) });
var popIn = (frame, fps, delay = 0, damping = 12) => (0, import_remotion.spring)({ frame: Math.max(0, frame - delay), fps, config: { damping, mass: 0.5, stiffness: 140 } });
var getSteamPath = (frame, index) => {
  const phase = (frame * 0.6 + index * 19) % 100 / 100;
  const progress = import_remotion.Easing.out(import_remotion.Easing.cubic)(phase);
  return {
    x: Math.sin(phase * Math.PI * 3 + index) * 10,
    y: -progress * 110,
    opacity: Math.sin(phase * Math.PI) * 0.45,
    scale: 0.5 + progress * 0.8
  };
};

// src/remotion/stickman/components/Stage.module.css
var Stage_default = {
  stage: "Stage_stage"
};

// src/remotion/stickman/lib/rig.ts
function solveLimb(root, target, upper, lower, bend = 1) {
  const dx = target.x - root.x, dy = target.y - root.y;
  const raw = Math.hypot(dx, dy);
  const distance = Math.max(Math.abs(upper - lower) + 1e-3, Math.min(upper + lower - 1e-3, raw));
  const ux = raw > 1e-4 ? dx / raw : 0, uy = raw > 1e-4 ? dy / raw : 1;
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const joint = { x: root.x + ux * along - uy * height * bend, y: root.y + uy * along + ux * height * bend };
  const end = { x: root.x + ux * distance, y: root.y + uy * distance };
  return { joint, end, path: `M${root.x} ${root.y}L${joint.x} ${joint.y}L${end.x} ${end.y}` };
}
var armPose = (side, target) => solveLimb({ x: side * 31, y: 108 }, target, 110, 110, side);
function gaitFoot(distance, offset) {
  const phase = ((distance / 200 + offset) % 1 + 1) % 1;
  if (phase < 0.5) return { x: 50 - phase * 200, y: 440 };
  const t = (phase - 0.5) * 2;
  const s = t * t * (3 - 2 * t);
  return { x: -50 + 100 * s, y: 440 - 32 * Math.sin(Math.PI * t) ** 2 };
}

// src/remotion/stickman/components/Character.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var ink = "#080810";
var cream = "#FFF1D6";
var Face = ({ emotion = "confident", frame = 0, gaze = 0, glasses = false, talking = false }) => {
  const blinkPhase = frame % 203;
  const blink = easeOut(blinkPhase, 176, 181) - easeOut(blinkPhase, 183, 190);
  const open = emotion === "surprised";
  const happy = emotion === "pleased";
  const mouth = talking ? 5 + 11 * Math.sin(frame * 0.24) ** 2 : open ? 12 : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { stroke: cream, strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { r: "60", fill: ink, stroke: "none" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5-59A60 60 0 0 1 56 19", fill: "none", stroke: "#FBC484", strokeWidth: "3", opacity: ".8" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { transform: `translate(${gaze * 8} 3) scale(1 ${Math.max(0.08, 1 - blink)})`, children: happy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-33-4Q-24-20-15-4M10-4Q19-20 28-4", fill: "none", strokeWidth: "6" }) : open || glasses ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: cream, stroke: "none", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: "-21", cy: "-7", rx: "7", ry: "10" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: "22", cy: "-7", rx: "7", ry: "10" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: cream, strokeWidth: "4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: emotion === "annoyed" ? "M-30-10L-13-5Q-16 7-23 1Z" : "M-29-8L-13-6Q-16 6-23 1Z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: emotion === "annoyed" ? "M13-6L30-6Q27 8 20 1Z" : "M13-6L29-8Q26 6 20 1Z" })
    ] }) }),
    glasses && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: "none", stroke: "#E6E7EC", strokeWidth: "3.5", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "-21", cy: "-5", r: "16" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "22", cy: "-5", r: "16" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-5-5Q0-11 6-5M-37-5l-16 5M38-5l14-6" })
    ] }),
    mouth ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: "3", cy: "28", rx: open ? 12 : 11, ry: mouth, fill: "none", strokeWidth: "4.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: happy ? "M-21 23Q1 49 27 19" : emotion === "annoyed" ? "M-14 28L17 31" : emotion === "calm" ? "M-14 27H15" : "M-17 27Q4 33 25 19", fill: "none", strokeWidth: "4.5" })
  ] });
};
var Stickman = ({ x, y, scale = 1, hero = false, walk = 0, walkAmplitude = walk === 0 ? 0 : 1, raised = 0, smile = 0, look = 0, surprised = false, frame = 0, emotion, phone = true, scarf = false, talking = false, leftHand, rightHand, seated = 0, headTilt = 0 }) => {
  const stride = Math.sin(walk) * 42 * walkAmplitude;
  const requestedLeft = leftHand || { x: -42 - stride * 0.6, y: 325 - raised * 300 };
  const requestedRight = rightHand || { x: 105 + stride * 0.6, y: 150 - raised * 230 };
  const leftArm = armPose(-1, requestedLeft), rightArm = armPose(1, requestedRight);
  const lh = leftArm.end, rh = rightArm.end;
  const left = leftArm.path, right = rightArm.path;
  const leftFoot = walkAmplitude ? gaitFoot(walk * 42, 0.5) : { x: -31, y: 440 };
  const rightFoot = walkAmplitude ? gaitFoot(walk * 42, 0) : { x: 37, y: 440 };
  const leftLeg = solveLimb({ x: -19, y: 250 }, leftFoot, 105, 105, -1);
  const rightLeg = solveLimb({ x: 20, y: 250 }, rightFoot, 105, 105, -1);
  const feet = [leftLeg.end, rightLeg.end];
  const faceEmotion = emotion ?? (surprised ? "surprised" : hero ? smile > 0.4 ? "pleased" : "confident" : "annoyed");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { transform: `translate(${x} ${y}) scale(${scale})`, strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cy: 454, rx: "78", ry: "12", fill: "#090A12", opacity: ".18" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { stroke: hero || scarf ? ink : "#302B3C", children: [
      seated > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M-19 250Q${-25 - stride + seated * 105} ${340 - seated * 80} ${-31 + stride + seated * 125} 440M20 250Q${28 + stride + seated * 95} ${340 - seated * 80} ${37 - stride + seated * 105} 440`, fill: "none", strokeWidth: "20" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M${-31 + stride + seated * 125} 440h-13M${37 - stride + seated * 105} 440h14`, strokeWidth: "22" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `${leftLeg.path}${rightLeg.path}`, fill: "none", strokeWidth: "20" }),
        feet.map((foot, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M${foot.x - 7} ${foot.y}h20`, strokeWidth: "22" }, i))
      ] }),
      hero ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-48 74Q-59 131-41 152H46Q57 116 46 74Q0 47-48 74Z", fill: "#2761D4", strokeWidth: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-31 91Q0 77 31 91L42 255H-41Z", fill: "url(#hoodie)", strokeWidth: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-6 106V161M9 106V158", stroke: "#F5E6C9", strokeWidth: "4" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-21 207H22L26 241H-26Z", fill: "#2456AC", stroke: "#193B81", strokeWidth: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M-40 249H41", stroke: "#5590F6", strokeWidth: "6" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M0 73V261", strokeWidth: "25" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M0 49V91", strokeWidth: "18" }),
      [left, right].map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, fill: "none", stroke: hero || scarf ? "#080810" : "#302B3C", strokeWidth: hero ? 33 : 19 }),
        hero && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d, fill: "none", stroke: "#3177ED", strokeWidth: "27" })
      ] }, i)),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: lh.x, cy: lh.y, rx: "14", ry: "17", fill: ink, stroke: "none" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", { cx: rh.x, cy: rh.y, rx: "14", ry: "17", fill: ink, stroke: "none" })
    ] }),
    scarf && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { fill: "#F1E3BD", stroke: "#C7B991", strokeWidth: "2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "-35", y: "65", width: "70", height: "27", rx: "13" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 89H23L31 218H9Z" }),
      [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M${-22 + i * 11} 69v20` }, i))
    ] }),
    phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { transform: `translate(${rh.x} ${rh.y}) rotate(12)`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "-15", y: "-48", width: "34", height: "64", rx: "5", fill: "#0A111C", stroke: "#A4AFBB", strokeWidth: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "-10", y: "-41", width: "24", height: "42", rx: "2", fill: hero ? "#8CE0A2" : "#D06C69" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cy: "7", cx: "2", r: "3", fill: "#CBD5E1" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { transform: `translate(${look * 7} 0) rotate(${look * 9 + headTilt})`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Face, { emotion: faceEmotion, gaze: look, frame, glasses: scarf, talking }) })
  ] });
};

// src/remotion/stickman/components/Art.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var C = { ink: "#111827", blue: "#2563EB", green: "#22C55E", red: "#EF4444", gold: "#FFD700" };
var Stage = ({ children }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { className: Stage_default.stage, viewBox: "0 0 1920 1080", xmlns: "http://www.w3.org/2000/svg", children: [
  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("defs", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("linearGradient", { id: "metal", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#94A3B8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: ".48", stopColor: "#4A5568" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#2D3748" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("linearGradient", { id: "silver", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#475569" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: ".4", stopColor: "#F1F5F9" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: ".6", stopColor: "#94A3B8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#334155" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("linearGradient", { id: "wood", x2: "0.8", y2: "1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#8C6650" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#6D4C41" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("linearGradient", { id: "screen", x2: "1", y2: "1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#133E34" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#050E13" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("linearGradient", { id: "hoodie", x2: "1", y2: "1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#60A5FA" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: ".4", stopColor: "#2563EB" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#163EA6" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("linearGradient", { id: "title", x2: "0", y2: "1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#FFF3A3" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: ".45", stopColor: "#FFBB39" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#F97316" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("radialGradient", { id: "warm", cx: ".9", cy: ".05", r: "1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#FDE047", stopOpacity: ".12" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#FDE047", stopOpacity: "0" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("radialGradient", { id: "dark", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { stopColor: "#22203D" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#0B0F19" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("radialGradient", { id: "vignette", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: ".45", stopColor: "#000", stopOpacity: "0" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("stop", { offset: "1", stopColor: "#000", stopOpacity: ".35" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("filter", { id: "shadow", x: "-50%", y: "-50%", width: "200%", height: "220%", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("feDropShadow", { dx: "0", dy: "18", stdDeviation: "18", floodOpacity: ".35" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("filter", { id: "glow", x: "-100%", y: "-100%", width: "300%", height: "300%", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("feGaussianBlur", { stdDeviation: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("feMerge", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("feMergeNode", {}),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("feMergeNode", { in: "SourceGraphic" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("filter", { id: "soft", x: "-100%", y: "-100%", width: "300%", height: "300%", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("feGaussianBlur", { stdDeviation: "5" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("filter", { id: "depth", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("feGaussianBlur", { stdDeviation: "3" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("pattern", { id: "hazard", width: "64", height: "64", patternUnits: "userSpaceOnUse", patternTransform: "rotate(-35)", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { width: "64", height: "64", fill: "#E9B93E" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { width: "32", height: "64", fill: "#111827" })
    ] })
  ] }),
  children,
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { width: "1920", height: "1080", fill: "url(#vignette)", pointerEvents: "none" })
] });
var Steam = ({ frame, x, y }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { transform: `translate(${x} ${y})`, children: Array.from({ length: 6 }, (_, i) => {
  const p = getSteamPath(frame, i);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "path",
    {
      d: "M -7 0 C -27 -20 25 -29 2 -50",
      fill: "none",
      stroke: "#FFF8E7",
      strokeWidth: "7",
      strokeLinecap: "round",
      opacity: p.opacity,
      transform: `translate(${p.x} ${p.y}) scale(${p.scale})`,
      filter: "url(#soft)"
    },
    i
  );
}) });
var Signal = ({ frame = 100, fps = 60, delay = 0, x = 0, y = 0, size = 1 }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("g", { transform: `translate(${x} ${y}) scale(${size})`, fill: C.green, filter: "url(#glow)", children: [25, 42, 60, 80, 102].map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: i * 30, y: -h * popIn(frame, fps, delay + i * 5), width: "20", height: Math.max(0, h * popIn(frame, fps, delay + i * 5)), rx: "5" }, i)) });
var Phone = ({ children, x = 0, y = 0, scale = 1, rotation = 0 }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("g", { transform: `translate(${x} ${y}) rotate(${rotation}) scale(${scale})`, children: [
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "-154", y: "-284", width: "308", height: "568", rx: "43", fill: "#64748B", filter: "url(#shadow)" }),
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "-150", y: "-280", width: "300", height: "560", rx: "40", fill: "#080D16", stroke: "#CBD5E1", strokeOpacity: ".4", strokeWidth: "2" }),
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "-136", y: "-263", width: "272", height: "526", rx: "28", fill: "url(#screen)" }),
  children,
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "-44", y: "-251", width: "88", height: "15", rx: "8", fill: "#020617" }),
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "-40", y: "243", width: "80", height: "4", rx: "2", fill: "#94A3B8" }),
  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M-146 -210V-130M154 -180V-80", stroke: "#A8B4C4", strokeWidth: "5" })
] });

// src/remotion/stickman/components/Kitchen.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var Kitchen = ({ frame = 0, leak = false, flow = 1 }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { width: "1920", height: "1080", fill: "#C9BAA2" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M0 780H1920V1080H0Z", fill: "#987B5F" }),
  Array.from({ length: 23 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M${i * 95} 1080L${480 + i * 48} 780`, stroke: "#765E4B", strokeWidth: "2", opacity: ".4" }, i)),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M0 203H1920M0 780H1920", stroke: "#DFD1B8", strokeWidth: "5" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "83", y: "300", width: "220", height: "480", fill: "#302A25", stroke: "#E3D6C2", strokeWidth: "12" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "1305", y: "260", width: "310", height: "340", fill: "#D0DAD6", stroke: "#E8DDC9", strokeWidth: "14" }),
  [0, 1, 2, 3].map((i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: 1320 + i * 72, y: 400 - i % 2 * 50, width: "58", height: 195 + i % 2 * 50, fill: "#ADB9B5" }),
    [0, 1, 2].map((j) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M${1330 + i * 72} ${435 + j * 45}h12m12 0h12`, stroke: "#DCE3D9", strokeWidth: "12" }, j))
  ] }, i)),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1458 260V600M1305 425H1615", stroke: "#E8DDC9", strokeWidth: "10" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1285 250h40v370h-65q40-180 25-370M1600 250h50q-25 190 20 370h-70Z", fill: "#D9B766" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "1685", y: "375", width: "165", height: "405", rx: "10", fill: "#E0DECE", stroke: "#B8B6AB", strokeWidth: "4" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1685 520h165M1708 542v80M1708 420v58", stroke: "#A7AA9F", strokeWidth: "5" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "420", y: "270", width: "390", height: "170", fill: "#849B89", stroke: "#677B70", strokeWidth: "4" }),
  [515, 610, 705].map((x) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M${x} 270V440m-13-55v28`, stroke: "#BDCBBA", strokeWidth: "3" }, x)),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M937 250h60v140l60 60H872l65-60Z", fill: "#E0DDCE" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "390", y: "450", width: "820", height: "170", fill: "#E7E2CF" }),
  Array.from({ length: 23 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M${390 + i * 37} 450V620`, stroke: "#BEC5B7", strokeWidth: "2" }, i)),
  [480, 515, 550, 585].map((y) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M390 ${y}H1210`, stroke: "#BEC5B7", strokeWidth: "2" }, y)),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M360 610H1250V643H360Z", fill: "#E8E3CE", stroke: "#BDBBAA", strokeWidth: "3" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "380", y: "643", width: "850", height: "220", fill: "#849B89", stroke: "#566C63", strokeWidth: "4" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M595 643V863M865 643V863M1075 643V863M380 710H595M865 710H1230", stroke: "#5C7468", strokeWidth: "4" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M455 680h45M940 680h45M1120 680h45", stroke: "#D4D9C9", strokeWidth: "6" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: "727", cy: "621", rx: "114", ry: "20", fill: "#71868C", stroke: "#BBC9C7", strokeWidth: "7" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M710 600V552q0-43 38-43q37 0 37 40", stroke: "#A9B9BA", strokeWidth: "12", fill: "none" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "1110", y: "566", width: "70", height: "44", rx: "10", fill: "#BFCAC1" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1125 566q0-50 40-13", fill: "none", stroke: "#40524C", strokeWidth: "7" }),
  leak && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "604", y: "650", width: "250", height: "210", fill: "#273339" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M726 648v63q0 41 45 41q45 0 45-41v-38", fill: "none", stroke: "#D0D9D0", strokeWidth: "14" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M717 695h22", stroke: "#4C605D", strokeWidth: "7" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: `M726 ${716 + Math.sin(frame % 48 / 48 * Math.PI / 2) * 65}q-12 18 0 20q12-2 0-20`, fill: "#C9F3FF", opacity: Math.sin(frame % 48 / 48 * Math.PI) * flow }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M679 789h97l-12 65h-73Z", fill: "#5387AB", stroke: "#A3C1D1", strokeWidth: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cx: "727", cy: "789", rx: "49", ry: "8", fill: "#A6D2E5" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M682 788q0-70 91 0", fill: "none", stroke: "#5387AB", strokeWidth: "4" })
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1457 0V246", stroke: "#5E5A4E", strokeWidth: "4" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1410 285l47-55 48 55Z", fill: "#3F5B50" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "350", cy: "315", r: "30", fill: "#E7DECD", stroke: "#6C756C", strokeWidth: "4" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M350 293v22l17 8", fill: "none", stroke: "#56615B", strokeWidth: "3" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { width: "1920", height: "1080", fill: "url(#warm)" })
] });
var TeaMug = ({ frame, x, y, tilt = 0, scale = 1 }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { transform: `translate(${x} ${y}) rotate(${tilt}) scale(${scale})`, children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M34-26q53-7 46 36q-4 27-46 19", fill: "none", stroke: "#D9CBAA", strokeWidth: "12" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M-40-35H40V43Q0 61-40 43Z", fill: "#CAB995", stroke: "#F3E5C5", strokeWidth: "4" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cy: "-35", rx: "40", ry: "10", fill: "#F4E8CB" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ellipse", { cy: "-35", rx: "32", ry: "6", fill: "#714B2A" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "-33", y: "-7", width: "66", height: "37", rx: "5", fill: "#343533" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Steam, { frame, x: 0, y: -45 })
] });

// src/remotion/stickman/VectorShot.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function motionValue(value, progress, fallback = 0) {
  if (value === void 0) return fallback;
  if (typeof value === "number") return value;
  if ("keys" in value) {
    const keys = value.keys;
    if (progress <= keys[0].at) return keys[0].value;
    const index = keys.findIndex((key) => key.at > progress);
    if (index < 0) return keys[keys.length - 1].value;
    const a = keys[index - 1], b = keys[index];
    if (a.ease === "hold") return a.value;
    const t = (progress - a.at) / (b.at - a.at);
    return a.value + (b.value - a.value) * (a.ease === "linear" ? t : t * t * (3 - 2 * t));
  }
  return (0, import_remotion2.interpolate)(progress, [value.start ?? 0, value.end ?? 1], [value.from, value.to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: import_remotion2.Easing.bezier(0.25, 0.1, 0.25, 1)
  });
}
function Layer({ layer, progress, frame }) {
  if (progress < (layer.enter ?? 0) || progress > (layer.exit ?? 1)) return null;
  const v = (value, fallback = 0) => motionValue(value, progress, fallback);
  let content;
  const stride = layer.stride === void 0 ? layer.walking ? (v(layer.x) - motionValue(layer.x, 0)) / Math.max(0.1, v(layer.scale, 1)) / 42 : 0 : v(layer.stride);
  const swing = Math.sin(stride * 42 / 200 * Math.PI * 2) * 18;
  const left = armPose(-1, { x: v(layer.leftHandX, -42 - swing), y: v(layer.leftHandY, 325 - v(layer.raised) * 300) }).end;
  const right = armPose(1, { x: v(layer.rightHandX, (layer.phone ? 105 : 42) + swing), y: v(layer.rightHandY, (layer.phone ? 150 : 325) - v(layer.raised) * 230) }).end;
  if (layer.type === "character") content = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    " ",
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      Stickman,
      {
        x: 0,
        y: 0,
        hero: layer.hero,
        scarf: layer.scarf,
        phone: layer.phone ?? false,
        frame,
        emotion: layer.emotion,
        talking: layer.speech === void 0 ? layer.talking : v(layer.speech) > 0.5,
        walk: stride,
        walkAmplitude: layer.walking || layer.stride !== void 0 ? 1 : 0,
        raised: v(layer.raised),
        look: v(layer.look),
        leftHand: left,
        rightHand: right,
        seated: v(layer.seated),
        headTilt: v(layer.headTilt)
      }
    ),
    layer.children?.map((child) => {
      const hand = child.attachment === "leftHand" ? left : child.attachment === "rightHand" ? right : { x: 0, y: 0 };
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("g", { transform: `translate(${hand.x} ${hand.y})`, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Layer, { layer: child, progress, frame }) }, child.id);
    })
  ] });
  else if (layer.type === "kitchen") content = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Kitchen, { frame, leak: layer.leak, flow: v(layer.flow, 1) });
  else if (layer.type === "mug") content = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(TeaMug, { frame, x: 0, y: 0 });
  else if (layer.type === "steam") content = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Steam, { frame, x: 0, y: 0 });
  else if (layer.type === "signal") content = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Signal, { frame });
  else if (layer.type === "phone") content = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Phone, {});
  else content = import_react.default.createElement(layer.type, { ...layer.attrs, ...Object.fromEntries(Object.entries(layer.animate || {}).map(([key, value]) => [key, v(value)])) }, layer.type === "text" ? layer.text : layer.children?.map((child) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Layer, { layer: child, progress, frame }, child.id)));
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("g", { transform: `translate(${v(layer.x)} ${v(layer.y)}) rotate(${v(layer.rotation)}) scale(${v(layer.scale, 1)})`, opacity: v(layer.opacity, 1), style: layer.blur ? { filter: `blur(${Math.max(0, v(layer.blur))}px)` } : void 0, children: content });
}
function VectorShot({ shot, frame, duration, fps = 60 }) {
  const progress = Math.max(0, Math.min(1, frame / Math.max(1, duration - 1)));
  const camera = shot.camera || {};
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Stage, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { width: 1920, height: 1080, fill: shot.background }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("g", { transform: `translate(${960 + motionValue(camera.x, progress)} ${540 + motionValue(camera.y, progress)}) scale(${motionValue(camera.scale, progress, 1)}) translate(${-motionValue(camera.focusX, progress, 960)} ${-motionValue(camera.focusY, progress, 540)})`, fontFamily: "Arial, Helvetica, sans-serif", strokeLinecap: "round", strokeLinejoin: "round", children: shot.layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Layer, { layer, progress, frame: frame * 60 / fps }, layer.id)) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { width: 1920, height: 56, fill: "#000" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { y: 1024, width: 1920, height: 56, fill: "#000" })
  ] });
}

// scripts/remotion-motion-render.test.ts
var import_server = require("react-dom/server");
var import_react2 = __toESM(require("react"), 1);
(0, import_node_test.test)("holds, interpolation and seeking preserve choreography", () => {
  const value = { keys: [{ at: 0, value: 0, ease: "hold" }, { at: 0.25, value: 10, ease: "linear" }, { at: 0.75, value: 30 }, { at: 1, value: 30 }] };
  import_strict.default.equal(motionValue(value, 0.2), 0);
  import_strict.default.equal(motionValue(value, 0.25), 10);
  import_strict.default.equal(motionValue(value, 0.5), 20);
  import_strict.default.equal(motionValue(value, 1), 30);
  const shot = { version: 1, styleId: "STICKMAN_500IQ_V1", direction: "motion test", background: "#D0C0A0", layers: [{ id: "actor", type: "character", hero: true, x: value, rightHandX: 120, rightHandY: 200, children: [{ id: "cup", type: "mug", attachment: "rightHand" }] }] };
  const render = (frame) => (0, import_server.renderToStaticMarkup)(import_react2.default.createElement(VectorShot, { shot, frame, duration: 121 }));
  const middle = render(60);
  render(100);
  import_strict.default.equal(render(60), middle);
  import_strict.default.match(middle, /translate\(120 200\)/);
  import_strict.default.notEqual(render(0), middle);
});
(0, import_node_test.test)("held prop follows clamped hand rather than unreachable requested point", () => {
  const shot = { version: 1, styleId: "STICKMAN_500IQ_V1", direction: "reach", background: "#FFFFFF", layers: [{ id: "actor", type: "character", rightHandX: 5e3, rightHandY: 108, children: [{ id: "prop", type: "g", attachment: "rightHand" }] }] };
  const html = (0, import_server.renderToStaticMarkup)(import_react2.default.createElement(VectorShot, { shot, frame: 0, duration: 60 }));
  import_strict.default.match(html, /translate\(250\.999 108\)/);
  import_strict.default.doesNotMatch(html, /translate\(5000 108\)/);
});
