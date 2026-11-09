"use client";

import * as React from "react";

// Haut de page « abstrait » : une matière lumineuse et fluide, calculée par la carte graphique (WebGL).
// Des voiles crème, sarcelle et or qui ondulent lentement ; la souris déplace la matière (profondeur)
// et y laisse une traînée de pixels, calculée dans le même rendu (mosaïque de la matière elle-même).
// Sans WebGL ou si l'appareil demande moins d'animations : une image fixe de la même matière.

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform sampler2D uTrail;
uniform float uCell;
uniform float uScroll; // 0 : haut de page entier, 1 : haut de page sorti de l'écran
uniform float uFocus; // 0 : clair à gauche (texte à gauche), 1 : clair au centre (texte centré)

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

vec3 matter(vec2 frag){
  vec2 uv = frag / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 1.6;
  // profondeur : la matière glisse légèrement avec la souris
  p += (uMouse - 0.5) * vec2(0.35, 0.22);
  // tourbillon doux autour du curseur
  vec2 m = vec2(uMouse.x * aspect, uMouse.y) * 1.6;
  vec2 d = p - m;
  float k = exp(-dot(d, d) * 2.2);
  p += vec2(-d.y, d.x) * k * 0.35;
  float t = uTime * 0.045;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p + 3.0 * r);

  vec3 cream = vec3(0.976, 0.957, 0.918);
  vec3 sand = vec3(0.957, 0.886, 0.769);
  vec3 gold = vec3(0.925, 0.741, 0.471);
  vec3 teal = vec3(0.290, 0.553, 0.545);
  vec3 deep = vec3(0.090, 0.282, 0.298);

  vec3 col = mix(cream, sand, smoothstep(0.25, 0.75, f));
  col = mix(col, teal, smoothstep(0.45, 0.95, length(q)) * 0.75);
  col = mix(col, deep, smoothstep(0.62, 1.05, r.x) * 0.55);
  col = mix(col, gold, smoothstep(0.55, 0.95, r.y) * 0.6);
  // lumière : plus claire à gauche (le texte s'y pose), plus riche à droite
  float leftLight = smoothstep(0.55, 0.0, uv.x) * 0.62;
  vec2 c = (uv - vec2(0.5, 0.48)) * vec2(1.0, 1.35);
  float centerLight = smoothstep(0.42, 0.0, length(c)) * 0.72;
  col = mix(col, cream, mix(leftLight, centerLight, uFocus));
  // reflet doux là où passe la souris
  col += vec3(1.0, 0.95, 0.85) * k * 0.06;
  return col;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  // La matière monte en s'évaporant quand on fait défiler.
  vec2 lifted = frag - vec2(0.0, uScroll * uRes.y * 0.45);
  vec3 col = matter(lifted);
  // seuil : la petite toile s'efface par paliers, on ignore les restes presque noirs
  float trail = (texture2D(uTrail, vec2(uv.x, 1.0 - uv.y)).r - 0.12) / 0.88;
  if (trail > 0.0) {
    vec2 cellPos = (floor(frag / uCell) + 0.5) * uCell;
    vec3 block = matter(cellPos);
    block = mix(block, vec3(1.0, 0.93, 0.8), 0.18);
    col = mix(col, block, min(1.0, trail * 1.1));
  }
  // Évaporation : un front irrégulier monte depuis le bas ; en dessous, la matière se dissout dans le fond
  // de la page (crème), avec une frange lumineuse le long du front. Le bas reste toujours fondu.
  vec3 page = vec3(0.984, 0.969, 0.938);
  float n = fbm(uv * vec2(3.2, 2.2) + vec2(0.0, -uTime * 0.06 - uScroll * 2.5));
  float front = -0.08 + uScroll * 1.45;
  float y = uv.y + (n - 0.5) * 0.38;
  float keep = smoothstep(front - 0.1, front + 0.14, y);
  float rest = smoothstep(0.0, 0.2, uv.y + (n - 0.5) * 0.12);
  col = mix(page, col, keep * rest);
  col += vec3(1.0, 0.94, 0.82) * (1.0 - abs(keep - 0.5) * 2.0) * 0.07 * smoothstep(0.0, 0.05, uScroll);
  // grain très léger
  col += (hash(frag + uTime) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export function HeroAbstract({ className, focus = "left" }: { className?: string; focus?: "left" | "center" }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return; // fond CSS de secours
    // Sans carte graphique (rendu logiciel), animer la matière coûte cher : on affiche une image fixe.
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const reduce = software || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
    } catch {
      return;
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uCell = gl.getUniformLocation(prog, "uCell");
    const uFocus = gl.getUniformLocation(prog, "uFocus");
    const uScroll = gl.getUniformLocation(prog, "uScroll");
    let scrollP = 0;

    // Traînée de pixels : une petite toile (une case = un pixel), envoyée comme texture.
    const trail = document.createElement("canvas");
    const tctx = trail.getContext("2d")!;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Rendu à résolution réduite : la matière est douce, l'agrandissement ne se voit pas.
    let scale = 0.6;
    let cell = 22;
    let w = 0;
    let h = 0;
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      scale = software ? 0.25 : w < 768 ? 0.4 : 0.45;
      cell = w < 768 ? 16 : 22;
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      trail.width = Math.ceil(w / cell);
      trail.height = Math.ceil(h / cell);
      tctx.fillStyle = "#000";
      tctx.fillRect(0, 0, trail.width, trail.height);
    };

    let raf = 0;
    let visible = true;
    let t = 7;
    let last = 0;
    let tx = 0.6;
    let ty = 0.5;
    let mx = 0.6;
    let my = 0.5;
    let lastPt: { x: number; y: number } | null = null;
    let lastMove = 0;

    const draw = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uCell, cell * scale);
      gl.uniform1f(uFocus, focus === "center" ? 1 : 0);
      gl.uniform1f(uScroll, scrollP);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, trail);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const loop = (now: number) => {
      // 30 images par seconde suffisent pour une matière lente
      if (last && now - last < 32) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const dt = last ? Math.min(0.06, (now - last) / 1000) : 0;
      last = now;
      t += dt;
      // sans souris depuis un moment, le point d'attention dérive doucement
      if (now - lastMove > 3000) {
        tx = 0.62 + 0.18 * Math.sin(t * 0.12);
        ty = 0.5 + 0.15 * Math.sin(t * 0.17);
      }
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
      // les pixels s'effacent : on assombrit la petite toile à chaque image
      tctx.fillStyle = `rgba(0,0,0,${Math.min(1, dt * 1.1)})`;
      tctx.fillRect(0, 0, trail.width, trail.height);
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const host = canvas.parentElement ?? canvas;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (y < 0 || y > rect.height) return;
      tx = x / rect.width;
      ty = 1 - y / rect.height;
      lastMove = performance.now();
      const from = lastPt ?? { x, y };
      const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / (cell * 0.6)));
      tctx.fillStyle = "#fff";
      for (let s = 0; s <= steps; s++) {
        const px = from.x + ((x - from.x) * s) / steps;
        const py = from.y + ((y - from.y) * s) / steps;
        const cx = Math.floor(px / cell);
        const cy = Math.floor(py / cell);
        tctx.fillRect(cx, cy, 1, 1);
        if (Math.random() < 0.45) tctx.fillRect(cx + (Math.random() < 0.5 ? -1 : 1), cy, 1, 1);
        if (Math.random() < 0.3) tctx.fillRect(cx, cy + (Math.random() < 0.5 ? -1 : 1), 1, 1);
      }
      lastPt = { x, y };
    };
    const onLeave = () => (lastPt = null);
    // Avancement du défilement sur le haut de page (0 → 1), lu par l'animation à chaque image.
    const onScroll = () => {
      const r = canvas.getBoundingClientRect();
      scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    };

    setup();
    draw();
    requestAnimationFrame(() => setReady(true));
    start();
    if (!reduce) {
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerleave", onLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    const ro = new ResizeObserver(() => {
      setup();
      draw();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [focus]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ opacity: ready ? 1 : 0, transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1)" }}
    />
  );
}
