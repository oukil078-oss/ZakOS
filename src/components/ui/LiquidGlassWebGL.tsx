import React, { useEffect, useRef } from 'react';

export interface LiquidGlassWebGLProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark';
  // Settings from liquid-glass WebGL shader
  thickness?: number; // default: 62
  bezel?: number;     // default: 60
  ior?: number;       // default: 3.0
  blur?: number;      // default: 2.0
  specular?: number;  // default: 0.55
  tint?: number;      // default: 0.08 (8%)
  shadow?: number;    // default: 0.50
  radius?: number;    // default: 100
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uGlassCenter;
uniform vec2 uGlassSize;
uniform float uRadius;
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform float uTint;
uniform float uShadow;
uniform vec3 uBaseColor;
uniform float uIsDark;
uniform float uScrollY;
uniform vec2 uMouse;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s*s*s*s, 0.25);
}

vec3 getAmbientBackground(vec2 screenUV) {
  float scrollFactor = uScrollY * 0.001;
  float wave = sin(screenUV.x * 6.28 + scrollFactor) * 0.5 + 0.5;

  if (uIsDark > 0.5) {
    vec3 c1 = vec3(0.043, 0.051, 0.063); // #0B0D10
    vec3 c2 = vec3(0.071, 0.082, 0.106); // #12151B
    vec3 c3 = vec3(0.20, 0.28, 0.05);   // vibrant lime ambient glow
    return mix(mix(c1, c2, screenUV.y), c3, 0.18 * wave);
  } else {
    vec3 c1 = vec3(0.957, 0.965, 0.973); // #F4F6F8
    vec3 c2 = vec3(1.0, 1.0, 1.0);
    vec3 c3 = vec3(0.88, 0.98, 0.82);   // light lime tint
    return mix(mix(c1, c2, screenUV.y), c3, 0.14 * wave);
  }
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;
  vec2 offsets[16];
  offsets[0]  = vec2(-0.94201, -0.39906);
  offsets[1]  = vec2( 0.94558, -0.76890);
  offsets[2]  = vec2(-0.09418, -0.92938);
  offsets[3]  = vec2( 0.34495,  0.29387);
  offsets[4]  = vec2(-0.91588, -0.45771);
  offsets[5]  = vec2(-0.81544,  0.48568);
  offsets[6]  = vec2(-0.38277, -0.56071);
  offsets[7]  = vec2(-0.12675,  0.84686);
  offsets[8]  = vec2( 0.89642,  0.41254);
  offsets[9]  = vec2( 0.18150, -0.30020);
  offsets[10] = vec2(-0.01445, -0.16001);
  offsets[11] = vec2( 0.59614,  0.71118);
  offsets[12] = vec2( 0.49742, -0.47280);
  offsets[13] = vec2( 0.80685,  0.04588);
  offsets[14] = vec2(-0.32490, -0.03965);
  offsets[15] = vec2(-0.60975,  0.06566);
  for (int i = 0; i < 16; i++) {
    sum += getAmbientBackground(uv + offsets[i] * radius * px);
  }
  return sum / 16.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
  vec2 p = screenPx - uGlassCenter;
  vec2 halfSize = uGlassSize * 0.5;

  float sd = sdRoundedRect(p, halfSize, uRadius);

  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 800.0);
    float shadowAlpha = uShadow * shadowFalloff * 0.5;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(uRadius, min(halfSize.x, halfSize.y)) - 1.0);
  float t = clamp(distFromEdge / max(bezel, 1.0), 0.0, 1.0);

  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;

  float slopeAngle = atan(dh * (uThickness / max(bezel, 1.0)));
  float sinR = sin(slopeAngle) / uIOR;
  sinR = clamp(sinR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 0.5;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, uRadius) - sd;
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, uRadius) - sd;
  grad = normalize(grad);

  vec2 offset = -grad * displacement / uResolution;

  vec2 screenUV = screenPx / uResolution;
  vec2 refractedUV = screenUV + offset;

  vec3 color = sampleBgBlurred(refractedUV, uBlur);

  // Dynamic light direction responsive to cursor interaction
  vec2 lightDir = normalize(vec2(0.5 + (uMouse.x - 0.5) * 0.4, -0.7 + (uMouse.y - 0.5) * 0.4));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.5);
  color += vec3(specHighlight * uSpecular);

  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.7, innerShadow * 0.3);

  float innerRim = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 5.0, distFromEdge));
  color += vec3(innerRim * 0.15 * uSpecular);

  color = mix(color, uBaseColor, uTint);

  // Subtle electric lime edge luminance
  float edgeLuminance = smoothstep(0.0, 2.0, distFromEdge) * (1.0 - smoothstep(2.0, 4.0, distFromEdge));
  color += vec3(0.83, 1.0, 0.0) * edgeLuminance * 0.35;

  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha * (uIsDark > 0.5 ? 0.95 : 0.88));
}
`;

export const LiquidGlassWebGL: React.FC<LiquidGlassWebGLProps> = ({
  children,
  className = '',
  style = {},
  theme = 'dark',
  thickness = 62, // From user settings screenshot
  bezel = 60,     // From user settings screenshot
  ior = 3.0,      // From user settings screenshot
  blur = 2.0,     // From user settings screenshot
  specular = 0.55,// From user settings screenshot
  tint = 0.08,    // From user settings screenshot (8%)
  shadow = 0.50,  // From user settings screenshot
  radius = 100,   // From user settings screenshot
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY || 0;
    };
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: true 
    });
    if (!gl) return;

    // Helper: Compile Shader
    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution');
    const uGlassCenterLoc = gl.getUniformLocation(program, 'uGlassCenter');
    const uGlassSizeLoc = gl.getUniformLocation(program, 'uGlassSize');
    const uRadiusLoc = gl.getUniformLocation(program, 'uRadius');
    const uBezelLoc = gl.getUniformLocation(program, 'uBezel');
    const uThicknessLoc = gl.getUniformLocation(program, 'uThickness');
    const uIORLoc = gl.getUniformLocation(program, 'uIOR');
    const uBlurLoc = gl.getUniformLocation(program, 'uBlur');
    const uSpecularLoc = gl.getUniformLocation(program, 'uSpecular');
    const uTintLoc = gl.getUniformLocation(program, 'uTint');
    const uShadowLoc = gl.getUniformLocation(program, 'uShadow');
    const uBaseColorLoc = gl.getUniformLocation(program, 'uBaseColor');
    const uIsDarkLoc = gl.getUniformLocation(program, 'uIsDark');
    const uScrollYLoc = gl.getUniformLocation(program, 'uScrollY');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const render = () => {
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width * dpr;
      const height = rect.height * dpr;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.useProgram(program);

      // Set Uniforms
      gl.uniform2f(uResolutionLoc, width, height);
      gl.uniform2f(uGlassCenterLoc, width * 0.5, height * 0.5);
      gl.uniform2f(uGlassSizeLoc, width, height);
      gl.uniform1f(uRadiusLoc, Math.min(radius * dpr, Math.min(width, height) * 0.5));
      gl.uniform1f(uBezelLoc, Math.min(bezel * dpr, Math.min(width, height) * 0.45));
      gl.uniform1f(uThicknessLoc, thickness * dpr);
      gl.uniform1f(uIORLoc, ior);
      gl.uniform1f(uBlurLoc, blur);
      gl.uniform1f(uSpecularLoc, specular);
      gl.uniform1f(uTintLoc, tint);
      gl.uniform1f(uShadowLoc, shadow);
      gl.uniform1f(uScrollYLoc, scrollYRef.current);
      gl.uniform2f(uMouseLoc, mousePosRef.current.x, mousePosRef.current.y);

      const isDark = theme === 'dark' ? 1.0 : 0.0;
      gl.uniform1f(uIsDarkLoc, isDark);

      if (isDark) {
        gl.uniform3f(uBaseColorLoc, 0.08, 0.09, 0.12);
      } else {
        gl.uniform3f(uBaseColorLoc, 0.98, 0.99, 1.0);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [theme, thickness, bezel, ior, blur, specular, tint, shadow, radius]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-full backdrop-blur-2xl ${className}`}
      style={{
        ...style,
        backdropFilter: 'blur(20px) saturate(1.8) brightness(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8) brightness(1.1)',
      }}
    >
      {/* WebGL Refraction Liquid Glass Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-full"
        style={{
          filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.5))',
        }}
      />

      {/* Floating Content Layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-between">
        {children}
      </div>
    </div>
  );
};

export default LiquidGlassWebGL;
