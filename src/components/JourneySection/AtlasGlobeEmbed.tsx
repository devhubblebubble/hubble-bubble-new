"use client";

import { useEffect, useRef } from "react";
import styles from "./AtlasGlobeEmbed.module.scss";

const MARKERS = [
  { code: "JP", city: "Tokyo",        name: "Japan",          lat: 35.6762,  lng: 139.6503 },
  { code: "US", city: "New York",     name: "United States",  lat: 40.7128,  lng: -74.006  },
  { code: "GB", city: "London",       name: "United Kingdom", lat: 51.5074,  lng: -0.1278  },
  { code: "DE", city: "Berlin",       name: "Germany",        lat: 52.52,    lng: 13.405   },
  { code: "AU", city: "Sydney",       name: "Australia",      lat: -33.8688, lng: 151.2093 },
  { code: "IN", city: "Mumbai",       name: "India",          lat: 19.076,   lng: 72.8777  },
  { code: "SG", city: "Singapore",    name: "Singapore",      lat: 1.3521,   lng: 103.8198 },
  { code: "FR", city: "Paris",        name: "France",         lat: 48.8566,  lng: 2.3522   },
  { code: "ZA", city: "Cape Town",    name: "South Africa",   lat: -33.9249, lng: 18.4241  },
  { code: "BR", city: "São Paulo",    name: "Brazil",         lat: -23.5505, lng: -46.6333 },
  { code: "EG", city: "Cairo",        name: "Egypt",          lat: 30.0444,  lng: 31.2357  },
  { code: "KR", city: "Seoul",        name: "South Korea",    lat: 37.5665,  lng: 126.978  },
];

const RADIUS = 2;
const CAMERA_Z = RADIUS * 3.8;
const FOV = 40; // degrees, vertical
const NEAR = 0.1;
const FAR = 1000;
const SEGMENTS = 96;
// Where the Earth texture is served from (the same picture, two sizes).
const TEXTURE_2K = "/images/globe/earth-2k.webp";
const TEXTURE_4K = "/images/globe/earth-4k.webp";

// Lights, matching the earlier three.js scene (linear colours already multiplied by intensity):
// sun 0xfffaf0 x 1.4 from (8, 4, 6), cool fill 0x88aaff x 0.35 from (-6, 2, -4), ambient 0.55.
const SUN_DIR = norm([8, 4, 6]);
const FILL_DIR = norm([-6, 2, -4]);
const SUN_COL = [1.4, 1.4 * 0.956, 1.4 * 0.8714];
const FILL_COL = [0.35 * 0.2462, 0.35 * 0.4021, 0.35];
const AMBIENT = 0.55;
// Surface roughness 0.85, so GGX alpha^2 = 0.85^4.
const A2 = Math.pow(0.855, 4);

function norm(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

function latLngToVec3(lat: number, lng: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-(r * Math.sin(phi) * Math.cos(theta)), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

const ANCHORS = MARKERS.map((m) => latLngToVec3(m.lat, m.lng, RADIUS * 1.005));

const VERTEX = `
attribute vec3 aPos;
attribute vec2 aUv;
uniform mat4 uProj;
uniform vec2 uTurn;   // sin, cos of the turn about the vertical axis
uniform vec3 uCam;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vec3 w = vec3(uTurn.y * aPos.x + uTurn.x * aPos.z, aPos.y, -uTurn.x * aPos.x + uTurn.y * aPos.z);
  vWorld = w;
  vUv = aUv;
  gl_Position = uProj * vec4(w - uCam, 1.0);
}`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uMap;
uniform vec3 uCam;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uFillDir;
uniform vec3 uFillCol;
uniform float uAmbient;
uniform float uA2;
varying vec2 vUv;
varying vec3 vWorld;

vec3 toLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
float ggx(float nh) {
  float d = nh * nh * (uA2 - 1.0) + 1.0;
  return 0.3183098861837907 * uA2 / (d * d);
}
float smithV(float nl, float nv) {
  float gv = nl * sqrt(uA2 + (1.0 - uA2) * nv * nv);
  float gl = nv * sqrt(uA2 + (1.0 - uA2) * nl * nl);
  return 0.5 / max(gv + gl, 1e-6);
}
// One directional light: diffuse and the broad, faint GGX sheen.
void shine(vec3 dir, vec3 col, vec3 n, vec3 v, inout vec3 diffuse, inout vec3 spec) {
  float nl = clamp(dot(n, dir), 0.0, 1.0);
  if (nl <= 0.0) return;
  vec3 irr = nl * col;
  vec3 h = normalize(dir + v);
  float nv = clamp(dot(n, v), 0.0, 1.0);
  float nh = clamp(dot(n, h), 0.0, 1.0);
  float vh = clamp(dot(v, h), 0.0, 1.0);
  float fr = exp2((-5.55473 * vh - 6.98316) * vh);
  float f = 0.04 * (1.0 - fr) + fr;
  diffuse += irr * 0.3183098861837907;
  spec += irr * f * smithV(nl, nv) * ggx(nh);
}
void main() {
  vec3 n = normalize(vWorld);
  vec3 v = normalize(uCam - vWorld);
  vec3 albedo = toLinear(texture2D(uMap, vUv).rgb);
  vec3 diffuse = vec3(uAmbient * 0.3183098861837907);
  vec3 spec = vec3(0.0);
  shine(uSunDir, uSunCol, n, v, diffuse, spec);
  shine(uFillDir, uFillCol, n, v, diffuse, spec);
  gl_FragColor = vec4(toSrgb(albedo * diffuse + spec), 1.0);
}`;

function sphere() {
  const stride = SEGMENTS + 1;
  const verts = new Float32Array(stride * stride * 5);
  let o = 0;
  for (let iy = 0; iy <= SEGMENTS; iy++) {
    const v = iy / SEGMENTS;
    for (let ix = 0; ix <= SEGMENTS; ix++) {
      const u = ix / SEGMENTS;
      verts[o++] = -RADIUS * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
      verts[o++] = RADIUS * Math.cos(v * Math.PI);
      verts[o++] = RADIUS * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
      verts[o++] = u;
      verts[o++] = 1 - v;
    }
  }
  const idx: number[] = [];
  for (let iy = 0; iy < SEGMENTS; iy++) {
    for (let ix = 0; ix < SEGMENTS; ix++) {
      const a = iy * stride + ix + 1;
      const b = iy * stride + ix;
      const c = (iy + 1) * stride + ix;
      const d = (iy + 1) * stride + ix + 1;
      if (iy !== 0) idx.push(a, b, d);
      if (iy !== SEGMENTS - 1) idx.push(b, c, d);
    }
  }
  return { verts, indices: new Uint16Array(idx) };
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

interface Props {
  rotation?: number;   // 0-1, drives the turn of the globe
  className?: string;
}

/**
 * The Earth on the Journey section: a lit, textured sphere drawn straight with
 * WebGL (no 3D library), with a pin and label for each city.
 *
 * It only draws while it is on screen and only when something changed (the
 * scroll turned it, the size changed), so a page that is scrolled past it, or a
 * phone that is idle, spends nothing on it. The picture is not fetched and
 * WebGL is not started until the section is close to the screen.
 */
export default function AtlasGlobeEmbed({ rotation = 0, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rotRef = useRef(rotation);
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    rotRef.current = rotation;
    redrawRef.current();
  }, [rotation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let vbo: WebGLBuffer | null = null;
    let ibo: WebGLBuffer | null = null;
    let indexCount = 0;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    let image: HTMLImageElement | null = null;
    let imageReady = false;
    let started = false;
    let visible = false;
    let ready = false;
    let raf = 0;
    let width = 0;
    let height = 0;
    let proj = new Float32Array(16);
    const geometry = sphere();

    const setProjection = () => {
      const f = 1 / Math.tan((FOV * Math.PI) / 360);
      const aspect = width / height;
      const nf = 1 / (NEAR - FAR);
      proj = new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (FAR + NEAR) * nf, -1,
        0, 0, 2 * FAR * NEAR * nf, 0,
      ]);
    };

    // Each city label's size, measured the first time it shows (it changes
    // only with the screen size, when it is measured again).
    const labelSize: ({ w: number; h: number } | null)[] = MARKERS.map(() => null);

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      labelSize.fill(null);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      setProjection();
    };

    const upload = () => {
      if (!gl || !image || !imageReady) return;
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
      if (aniso) {
        const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
        gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
      }
      ready = true;
      canvas.dataset.ready = "true";
      schedule();
    };

    const setup = () => {
      gl = (canvas.getContext("webgl", { antialias: true, alpha: true }) ||
        canvas.getContext("experimental-webgl", { antialias: true, alpha: true })) as WebGLRenderingContext | null;
      if (!gl) {
        canvas.dataset.gl = "none";
        return false;
      }
      const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram();
      if (!vs || !fs || !program) {
        canvas.dataset.gl = "none";
        return false;
      }
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        canvas.dataset.gl = "none";
        return false;
      }
      gl.useProgram(program);

      vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);
      ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      indexCount = geometry.indices.length;

      const aPos = gl.getAttribLocation(program, "aPos");
      const aUv = gl.getAttribLocation(program, "aUv");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(aUv);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 20, 12);

      uniforms = {};
      for (const name of ["uProj", "uTurn", "uCam", "uMap", "uSunDir", "uSunCol", "uFillDir", "uFillCol", "uAmbient", "uA2"]) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      gl.uniform3f(uniforms.uCam, 0, 0, CAMERA_Z);
      gl.uniform3fv(uniforms.uSunDir, SUN_DIR);
      gl.uniform3fv(uniforms.uSunCol, SUN_COL);
      gl.uniform3fv(uniforms.uFillDir, FILL_DIR);
      gl.uniform3fv(uniforms.uFillCol, FILL_COL);
      gl.uniform1f(uniforms.uAmbient, AMBIENT);
      gl.uniform1f(uniforms.uA2, A2);
      gl.uniform1i(uniforms.uMap, 0);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
      return true;
    };

    const draw = () => {
      raf = 0;
      if (!gl || !ready || !visible || width === 0 || gl.isContextLost()) return;
      const turn = rotRef.current * Math.PI * 1.6;
      const sin = Math.sin(turn);
      const cos = Math.cos(turn);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(uniforms.uProj, false, proj);
      gl.uniform2f(uniforms.uTurn, sin, cos);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

      // City pins: project each one and move its label into place.
      const f = 1 / Math.tan((FOV * Math.PI) / 360);
      const aspect = width / height;
      const shown: { i: number; x: number; y: number; facing: number }[] = [];
      for (let i = 0; i < ANCHORS.length; i++) {
        const el = markerRefs.current[i];
        if (!el) continue;
        const [ax, ay, az] = ANCHORS[i];
        const wx = cos * ax + sin * az;
        const wz = -sin * ax + cos * az;
        const facing = wz / Math.hypot(wx, ay, wz);
        if (facing < 0.05) {
          if (el.dataset.on) delete el.dataset.on;
          continue;
        }
        const depth = CAMERA_Z - wz;
        const x = ((f / aspect) * wx / depth * 0.5 + 0.5) * width;
        const y = (1 - ((f * ay) / depth * 0.5 + 0.5)) * height;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
        el.dataset.on = "1";
        shown.push({ i, x, y, facing });
      }

      // Labels never pile up: the cities facing the camera most are labelled
      // first, and a label that would overlap one already placed, or stick out
      // of the globe's box, is hidden. Its pin stays.
      shown.sort((a, b) => b.facing - a.facing);
      const placed: number[][] = [];
      for (const s of shown) {
        const el = markerRefs.current[s.i]!;
        let size = labelSize[s.i];
        if (!size) {
          size = { w: el.offsetWidth, h: el.offsetHeight };
          if (size.w > 0) labelSize[s.i] = size;
        }
        // The chip is the top of the marker; the stem below it can overlap.
        const box = [s.x - size.w / 2 - 4, s.y - size.h - 4, s.x + size.w / 2 + 4, s.y - size.h + 30];
        const clash =
          box[0] < 0 ||
          box[1] < 0 ||
          box[2] > width ||
          placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1]);
        if (clash) {
          el.dataset.label = "off";
        } else {
          delete el.dataset.label;
          placed.push(box);
        }
      }
    };

    function schedule() {
      if (raf || !visible || !ready) return;
      raf = requestAnimationFrame(draw);
    }
    redrawRef.current = schedule;

    const load = () => {
      // The sharper picture only where the globe is big enough to show the difference.
      const diameter = Math.min(wrap.clientWidth, wrap.clientHeight) * 0.75 * Math.min(window.devicePixelRatio || 1, 2);
      const maxTexture = gl ? (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) : 0;
      image = new Image();
      image.decoding = "async";
      image.onload = () => {
        imageReady = true;
        upload();
      };
      image.src = diameter > 900 && maxTexture >= 4096 ? TEXTURE_4K : TEXTURE_2K;
    };

    const start = () => {
      if (started) return;
      started = true;
      resize();
      if (!setup()) return;
      load();
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      ready = false;
      delete canvas.dataset.ready;
    };
    const onRestored = () => {
      texture = null;
      if (setup()) upload();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) {
          start();
          schedule();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(wrap);

    const ro = new ResizeObserver(() => {
      resize();
      schedule();
    });
    ro.observe(wrap);

    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      redrawRef.current = () => {};
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (image) image.onload = null;
      if (gl && !gl.isContextLost()) {
        if (texture) gl.deleteTexture(texture);
        if (vbo) gl.deleteBuffer(vbo);
        if (ibo) gl.deleteBuffer(ibo);
        if (program) gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, []);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ""}`}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.markers}>
        {MARKERS.map((m, i) => (
          <div
            key={m.code}
            ref={(el) => {
              markerRefs.current[i] = el;
            }}
            className={styles.marker}
          >
            <div className={styles.chip}>
              <span className={styles.avatar}>{m.code}</span>
              <span className={styles.chipText}>
                {m.city}
                <small>{m.name.toUpperCase()}</small>
              </span>
            </div>
            <div className={styles.stem} />
            <div className={styles.pin} />
          </div>
        ))}
      </div>
    </div>
  );
}
