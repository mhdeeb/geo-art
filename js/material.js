import * as THREE from "./three.module.min.js";
import {
  DEFAULT_T_LIMIT,
  DEFAULT_COLOR_MODE,
  DEFAULT_C1,
  DEFAULT_C2,
  DEFAULT_C3,
  DEFAULT_ALPHA,
} from "./constants.js";

function createUniforms(colorNumber = DEFAULT_COLOR_MODE, tLimit = DEFAULT_T_LIMIT) {
  return {
    type: { value: colorNumber },
    time: { value: 0 },
    normalize_parameters: { value: true },
    min_point: { value: new THREE.Vector4(-1, -1, 0, 0) },
    volume: { value: new THREE.Vector4(2, 2, 0, tLimit) },
    min_time: { value: 0 },
    max_time: { value: tLimit },
    solid_color: { value: new THREE.Color("#ffffff") },
  };
}

// Generate fragment shader with custom expressions for points
export function generateFragmentShader(c1Expr, c2Expr, c3Expr, alphaExpr) {
  return `
varying vec4 space_time;
uniform int type;
uniform vec3 solid_color;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float E = 2.71828182846;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float norm(float value, float min1, float max1) {
    return (value - min1) / (max1 - min1);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

vec4 color_function(vec4 st) {
    float x = st.x;
    float y = st.y;
    float z = st.z;
    float t = st.w;
    
    float c1 = ${c1Expr};
    float c2 = ${c2Expr};
    float c3 = ${c3Expr};
    float a = ${alphaExpr};
    
    if (type == 0) {
        // RGB mode - clamp all channels to [0, 1]
        return vec4(clamp(c1, 0.0, 1.0), clamp(c2, 0.0, 1.0), clamp(c3, 0.0, 1.0), clamp(a, 0.0, 1.0));
    } else if (type == 1) {
        // HSV mode - hue wraps with fract, saturation/value clamped
        vec3 rgb = hsv2rgb(vec3(fract(c1), clamp(c2, 0.0, 1.0), clamp(c3, 0.0, 1.0)));
        return vec4(rgb, clamp(a, 0.0, 1.0));
    } else {
        return vec4(solid_color, clamp(a, 0.0, 1.0));
    }
}

void main() {
    gl_FragColor = color_function(space_time);
}
`;
}

// Generate fragment shader for lines (uses vLinePos instead of space_time)
export function generateLineFragmentShader(c1Expr, c2Expr, c3Expr, alphaExpr) {
  return `
uniform float opacity;
uniform float linewidth;
uniform int type;
uniform vec3 solid_color;
uniform float time;
uniform bool normalize_parameters;
uniform vec4 min_point;
uniform vec4 volume;

varying vec3 vLinePos;

#ifdef WORLD_UNITS
    varying vec4 worldPos;
    varying vec3 worldStart;
    varying vec3 worldEnd;
#endif

varying vec2 vUv;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float E = 2.71828182846;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float norm(float value, float min1, float max1) {
    return (value - min1) / (max1 - min1);
}

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {
    float mua;
    float mub;
    vec3 p13 = p1 - p3;
    vec3 p43 = p4 - p3;
    vec3 p21 = p2 - p1;
    float d1343 = dot( p13, p43 );
    float d4321 = dot( p43, p21 );
    float d1321 = dot( p13, p21 );
    float d4343 = dot( p43, p43 );
    float d2121 = dot( p21, p21 );
    float denom = d2121 * d4343 - d4321 * d4321;
    float numer = d1343 * d4321 - d1321 * d4343;
    mua = numer / denom;
    mua = clamp( mua, 0.0, 1.0 );
    mub = ( d1343 + d4321 * ( mua ) ) / d4343;
    mub = clamp( mub, 0.0, 1.0 );
    return vec2( mua, mub );
}

vec4 color_function(vec4 st) {
    float x = st.x;
    float y = st.y;
    float z = st.z;
    float t = st.w;
    
    float c1 = ${c1Expr};
    float c2 = ${c2Expr};
    float c3 = ${c3Expr};
    float a = ${alphaExpr};
    
    if (type == 0) {
        // RGB mode - clamp all channels to [0, 1]
        return vec4(clamp(c1, 0.0, 1.0), clamp(c2, 0.0, 1.0), clamp(c3, 0.0, 1.0), clamp(a, 0.0, 1.0));
    } else if (type == 1) {
        // HSV mode - hue wraps with fract, saturation/value clamped
        vec3 rgb = hsv2rgb(vec3(fract(c1), clamp(c2, 0.0, 1.0), clamp(c3, 0.0, 1.0)));
        return vec4(rgb, clamp(a, 0.0, 1.0));
    } else {
        return vec4(solid_color, clamp(a, 0.0, 1.0));
    }
}

void main() {
    float alpha = opacity;

    #ifdef WORLD_UNITS
        vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
        vec3 lineDir = worldEnd - worldStart;
        vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );
        vec3 p1 = worldStart + lineDir * params.x;
        vec3 p2 = rayEnd * params.y;
        vec3 delta = p1 - p2;
        float len = length( delta );
        float normVal = len / linewidth;
        
        #ifdef USE_ALPHA_TO_COVERAGE
            float dnorm = fwidth( normVal );
            alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, normVal );
        #else
            if ( normVal > 0.5 ) discard;
        #endif
    #else
        #ifdef USE_ALPHA_TO_COVERAGE
            float a = vUv.x;
            float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
            float len2 = a * a + b * b;
            float dlen = fwidth( len2 );
            if ( abs( vUv.y ) > 1.0 ) {
                alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );
            }
        #else
            if ( abs( vUv.y ) > 1.0 ) {
                float a = vUv.x;
                float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
                float len2 = a * a + b * b;
                if ( len2 > 1.0 ) discard;
            }
        #endif
    #endif

    // Calculate space_time for color
    vec4 space_time;
    if (normalize_parameters) {
        space_time.x = (vLinePos.x - min_point.x) / volume.x;
        space_time.y = (vLinePos.y - min_point.y) / volume.y;
        space_time.z = (vLinePos.z - min_point.z) / volume.z;
        space_time.w = (time - min_point.w) / volume.w;
    } else {
        space_time = vec4(vLinePos, time);
    }

    vec4 customColor = color_function(space_time);
    gl_FragColor = vec4(customColor.rgb, customColor.a * alpha);
}
`;
}

// Custom vertex shader for lines that passes position to fragment
const lineVertexShader = `
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

uniform float linewidth;
uniform vec2 resolution;

attribute vec3 instanceStart;
attribute vec3 instanceEnd;

attribute vec3 instanceColorStart;
attribute vec3 instanceColorEnd;

#ifdef WORLD_UNITS
    varying vec4 worldPos;
    varying vec3 worldStart;
    varying vec3 worldEnd;
#endif

varying vec2 vUv;
varying vec3 vLinePos;

void trimSegment( const in vec4 start, inout vec4 end ) {
    float a = projectionMatrix[ 2 ][ 2 ];
    float b = projectionMatrix[ 3 ][ 2 ];
    float nearEstimate = - 0.5 * b / a;
    float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );
    end.xyz = mix( start.xyz, end.xyz, alpha );
}

void main() {
    #ifdef USE_COLOR
        vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;
    #endif

    vUv = uv;
    
    // Pass the line position to fragment shader for color calculation
    vLinePos = ( position.y < 0.5 ) ? instanceStart : instanceEnd;

    float aspect = resolution.x / resolution.y;

    vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
    vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

    #ifdef WORLD_UNITS
        worldStart = start.xyz;
        worldEnd = end.xyz;
    #endif

    bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );

    if ( perspective ) {
        if ( start.z < 0.0 && end.z >= 0.0 ) {
            trimSegment( start, end );
        } else if ( end.z < 0.0 && start.z >= 0.0 ) {
            trimSegment( end, start );
        }
    }

    vec4 clipStart = projectionMatrix * start;
    vec4 clipEnd = projectionMatrix * end;

    vec3 ndcStart = clipStart.xyz / clipStart.w;
    vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

    vec2 dir = ndcEnd.xy - ndcStart.xy;
    dir.x *= aspect;
    dir = normalize( dir );

    #ifdef WORLD_UNITS
        vec3 worldDir = normalize( end.xyz - start.xyz );
        vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
        vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
        vec3 worldFwd = cross( worldDir, worldUp );
        worldPos = position.y < 0.5 ? start: end;

        float hw = linewidth * 0.5;
        worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

        worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;
        worldPos.xyz += worldFwd * hw;

        if ( position.y > 1.0 || position.y < 0.0 ) {
            worldPos.xyz -= worldFwd * 2.0 * hw;
        }

        vec4 clip = projectionMatrix * worldPos;
        vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
        clip.z = clipPose.z * clip.w;
    #else
        vec2 offset = vec2( dir.y, - dir.x );
        dir.x /= aspect;
        offset.x /= aspect;

        if ( position.x < 0.0 ) offset *= - 1.0;

        if ( position.y < 0.0 ) {
            offset += - dir;
        } else if ( position.y > 1.0 ) {
            offset += dir;
        }

        offset *= linewidth;
        offset /= resolution.y;

        vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;
        offset *= clip.w;
        clip.xy += offset;
    #endif

    gl_Position = clip;

    vec4 mvPosition = ( position.y < 0.5 ) ? start : end;

    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <fog_vertex>
}
`;

async function loadShader(path) {
  return await (await fetch(path)).text();
}

// Cache for vertex shaders
let pointVertexShader = null;

// Load vertex shaders
async function loadVertexShaders() {
  if (!pointVertexShader) {
    pointVertexShader = await loadShader("shader/shader.vert");
  }
  return { pointVertexShader };
}

// Material for instanced geometry (points/circles)
export async function getPointShaderMaterial(c1 = DEFAULT_C1, c2 = DEFAULT_C2, c3 = DEFAULT_C3, alpha = DEFAULT_ALPHA) {
  const { pointVertexShader } = await loadVertexShaders();
  const fragmentShader = generateFragmentShader(c1, c2, c3, alpha);

  return new THREE.ShaderMaterial({
    uniforms: createUniforms(),
    vertexShader: pointVertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

// Custom line material with our color expressions
export function getCustomLineMaterial(c1 = DEFAULT_C1, c2 = DEFAULT_C2, c3 = DEFAULT_C3, alpha = DEFAULT_ALPHA) {
  const fragmentShader = generateLineFragmentShader(c1, c2, c3, alpha);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...createUniforms(),
      linewidth: { value: 0.002 },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      opacity: { value: 1.0 },
      diffuse: { value: new THREE.Color(0xffffff) },
    },
    vertexShader: lineVertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Add getters/setters for linewidth and resolution like LineMaterial
  Object.defineProperty(material, 'linewidth', {
    get: function () { return this.uniforms.linewidth.value; },
    set: function (value) { this.uniforms.linewidth.value = value; }
  });

  Object.defineProperty(material, 'resolution', {
    get: function () { return this.uniforms.resolution.value; },
    set: function (value) { this.uniforms.resolution.value.copy(value); }
  });

  return material;
}

// Update materials with new expressions
export async function updateMaterialShaders(materialLine, materialCircle, c1, c2, c3, alpha) {
  await loadVertexShaders();

  if (materialCircle) {
    materialCircle.fragmentShader = generateFragmentShader(c1, c2, c3, alpha);
    materialCircle.needsUpdate = true;
  }

  if (materialLine) {
    materialLine.fragmentShader = generateLineFragmentShader(c1, c2, c3, alpha);
    materialLine.needsUpdate = true;
  }

  return { success: true };
}

// Legacy function for backwards compatibility
export async function getShaderMaterial() {
  return getPointShaderMaterial();
}
