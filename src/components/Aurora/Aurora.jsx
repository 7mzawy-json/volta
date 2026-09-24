import { useEffect, useRef } from 'react';
import styles from './Aurora.module.css';

// A slow aurora of brand greens behind the hero, in place of the flat radial
// glow that was there. The shader is React Bits' Aurora (licence below); the
// code around it is rewritten.
//
// What changed from the original, and why:
//
// 1. No ogl. The original used the ogl library for a canvas, a triangle and a
//    shader program, about 10 to 15 KB compressed for work that is forty lines
//    of plain WebGL. The shader itself is unchanged.
// 2. It stops when nobody can see it: paused off screen, and a single still
//    frame for anyone who asked their system for reduced motion.
// 3. Nothing is allocated per frame. The original rebuilt its colour objects
//    and re-sent every uniform 60 times a second; here the colours are set once
//    and only the clock changes.
// 4. Drawn at half resolution and scaled up. An aurora has no edge to resolve,
//    and on a 3x phone this is a thirty-sixth of the original's pixel work.
// 5. Its light mode is rewritten. The original painted an opaque white canvas,
//    which on the ivory theme is a white rectangle. Here the light theme keeps
//    the colour at full strength and fades by transparency alone: dimming
//    towards black, as the dark theme does, turns green into grey smoke on
//    ivory. The theme is read every frame, so a switch lands on the next one.
//
// It drifts slowly and its brightness has no sudden changes; nothing flashes.
//
// ---------------------------------------------------------------------------
// MIT + Commons Clause License Condition v1.0
//
// Copyright (c) 2026 David Haz
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, and distribute the Software as part of
// an application, website, or product, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// Commons Clause Restriction: You may use this Software, including for any
// commercial purpose, so long as you do not sell, sublicense, or redistribute
// the components themselves, whether alone, in a bundle, or as a ported
// version.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// ---------------------------------------------------------------------------

const VERTEX = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;
uniform float uLight;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Three stops at 0, 0.5 and 1 across the width.
vec3 ramp(float t) {
  return t < 0.5
    ? mix(uColorStops[0], uColorStops[1], t * 2.0)
    : mix(uColorStops[1], uColorStops[2], (t - 0.5) * 2.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 rampColor = ramp(uv.x);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  // Dark: light that dims towards black. Light: a tint that fades by alpha only.
  vec3 color = uLight > 0.5 ? rampColor : intensity * rampColor;
  fragColor = vec4(color * auroraAlpha, auroraAlpha);
}
`;

const REDUCED = '(prefers-reduced-motion: reduce)';
const SCALE = 0.5;

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

// Deep green, the brand green, and a green that leans towards teal: one hue
// family, so it reads as the brand's light rather than a rainbow.
const BRAND_STOPS = ['#0E7A2E', '#39FF14', '#14B87A'];

export default function Aurora({ colorStops = BRAND_STOPS, amplitude = 1, blend = 0.5, speed = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { alpha: true, premultipliedAlpha: true });
    // No WebGL2: the hero simply has no aurora.
    if (!gl) return undefined;

    const compile = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(VERTEX, gl.VERTEX_SHADER);
    const fragment = compile(FRAGMENT, gl.FRAGMENT_SHADER);
    if (!vertex || !fragment) return undefined;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    // One triangle larger than the screen covers every pixel with no seam.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name) => gl.getUniformLocation(program, name);
    const uTime = uniform('uTime');
    const uResolution = uniform('uResolution');
    const uLight = uniform('uLight');
    const root = document.documentElement;
    gl.uniform1f(uniform('uAmplitude'), amplitude);
    gl.uniform1f(uniform('uBlend'), blend);
    gl.uniform3fv(uniform('uColorStops'), colorStops.flatMap(hexToRgb));
    gl.clearColor(0, 0, 0, 0);

    // The canvas resize is conditional; viewport and resolution are set every
    // draw, because a second effect run on an already sized canvas (StrictMode
    // in development) would otherwise never set them.
    const fit = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };

    const draw = (seconds) => {
      fit();
      gl.uniform1f(uTime, seconds * speed);
      gl.uniform1f(uLight, root.dataset.theme === 'dark' ? 0 : 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let frame = 0;
    let elapsed = 0;
    let last = 0;
    const loop = (now) => {
      // Frame time, not wall time, so returning on screen continues the drift
      // rather than jumping to wherever it would have got to.
      if (last) elapsed += (now - last) / 1000;
      last = now;
      draw(elapsed);
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };

    const still = window.matchMedia(REDUCED).matches;
    const redrawIfIdle = () => (still || !frame) && draw(elapsed);
    const resize = new ResizeObserver(redrawIfIdle);
    resize.observe(canvas);
    // A theme switch while nothing is animating (reduced motion) still repaints.
    const theme = new MutationObserver(redrawIfIdle);
    theme.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    let visibility = null;
    if (still) {
      draw(0);
    } else {
      visibility = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !frame) frame = requestAnimationFrame(loop);
        if (!entry.isIntersecting) stop();
      });
      visibility.observe(canvas);
    }

    return () => {
      stop();
      visibility?.disconnect();
      resize.disconnect();
      theme.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [colorStops, amplitude, blend, speed]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
