import { useEffect, useRef } from 'react';
import styles from './Lightning.module.css';

// A bolt of lightning behind the hero phone: the brand's own mark, "Power up",
// drawn live in a fragment shader. Adapted from React Bits (licence below).
//
// What changed from the original, and why:
//
// 1. It no longer strobes. The original re-randomised the bolt's brightness
//    every frame, anywhere from zero to full, which is a 60 Hz flicker. WCAG
//    2.3.1 asks for no more than three flashes a second, and a flickering glow
//    at the top of the homepage is exactly where someone with photosensitive
//    epilepsy would meet it. The brightness now drifts on smooth noise inside a
//    narrow band, so it breathes rather than flashes, and never goes dark.
// 2. It stops when nobody can see it: paused off screen, and a single still
//    frame for anyone who asked their system for reduced motion.
// 3. It resizes only when its box changes. Setting canvas.width wipes the
//    drawing buffer even when the value is the same, and the original did it
//    every frame.
// 4. It frees its GPU program and buffer on unmount, where the original leaked
//    them on every route change. It does NOT force-lose the context: React's
//    StrictMode runs this effect twice on the same canvas in development, and
//    the second run would inherit a dead context and draw nothing.
// 5. The faint haze is cut to transparent, and what remains of the halo is
//    green rather than dark. The glow falls off as 1/distance, so every pixel
//    carried a little dim colour: invisible-ish on the dark theme, grey smoke
//    inside a visible rectangle on the light one.
// 6. Six noise octaves rather than ten. The last four contribute under 1.6% of
//    the displacement between them, which is invisible here and costs a phone's
//    GPU most of the per-pixel work.
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

const VERTEX = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uHue;
uniform float uXOffset;
uniform float uSpeed;
uniform float uIntensity;
uniform float uSize;

#define OCTAVE_COUNT 6

vec3 hsv2rgb(vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

mat2 rotate2d(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat2(c, -s, s, c);
}

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float a = hash12(ip);
  float b = hash12(ip + vec2(1.0, 0.0));
  float c = hash12(ip + vec2(0.0, 1.0));
  float d = hash12(ip + vec2(1.0, 1.0));
  vec2 t = smoothstep(0.0, 1.0, fp);
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < OCTAVE_COUNT; ++i) {
    value += amplitude * noise(p);
    p *= rotate2d(0.45);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  uv = 2.0 * uv - 1.0;
  uv.x *= iResolution.x / iResolution.y;
  uv.x += uXOffset;

  uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;

  float dist = abs(uv.x);
  vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
  // Smooth, bounded flicker: see note 1 at the top of the file.
  float flicker = mix(0.05, 0.07, noise(vec2(iTime * uSpeed * 1.5, 0.0)));
  vec3 col = baseColor * (flicker / dist) * uIntensity;
  // Haze below the threshold is dropped entirely: see note 5.
  float a = smoothstep(0.06, 0.45, max(col.r, max(col.g, col.b)));
  // The core keeps its white-hot colour; the halo takes the pure hue.
  gl_FragColor = vec4(clamp(max(col, baseColor), 0.0, 1.0), a);
}
`;

const REDUCED = '(prefers-reduced-motion: reduce)';

// #39FF14, the brand green, is hue 111.
export default function Lightning({ hue = 111, xOffset = 0, speed = 1, intensity = 1, size = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    // No WebGL (old device, disabled GPU): the hero simply has no bolt.
    if (!gl) return undefined;

    const compile = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const program = gl.createProgram();
    const vertex = compile(VERTEX, gl.VERTEX_SHADER);
    const fragment = compile(FRAGMENT, gl.FRAGMENT_SHADER);
    if (!vertex || !fragment) return undefined;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name) => gl.getUniformLocation(program, name);
    const uResolution = uniform('iResolution');
    const uTime = uniform('iTime');
    gl.uniform1f(uniform('uHue'), hue);
    gl.uniform1f(uniform('uXOffset'), xOffset);
    gl.uniform1f(uniform('uSpeed'), speed);
    gl.uniform1f(uniform('uIntensity'), intensity);
    gl.uniform1f(uniform('uSize'), size);

    // CSS pixels, not device pixels: a glow has no edges worth resolving, and
    // on a 3x phone this is a ninth of the fragments.
    //
    // Only the canvas resize is conditional. The viewport and resolution are
    // set every draw: they are cheap, and a second effect run on an already
    // sized canvas (StrictMode, see note 4) would otherwise never set them.
    const fit = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };

    const start = performance.now();
    const draw = (seconds) => {
      fit();
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    let frame = 0;
    const loop = () => {
      draw((performance.now() - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const still = window.matchMedia(REDUCED).matches;
    let visibility = null;
    const resize = new ResizeObserver(() => still && draw(2.4));

    if (still) {
      // One frame, chosen because the bolt is well formed at that moment.
      draw(2.4);
    } else {
      visibility = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !frame) loop();
        if (!entry.isIntersecting) stop();
      });
      visibility.observe(canvas);
    }
    resize.observe(canvas);

    return () => {
      stop();
      visibility?.disconnect();
      resize.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
