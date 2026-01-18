varying vec4 space_time;
uniform int type;
uniform vec3 solid_color;

// Color parameter uniforms
uniform float c1_scale;
uniform float c1_offset;
uniform float c2_value;
uniform float c3_value;
uniform float alpha_value;

const float PI = 3.14159265359;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 color_function(vec4 st) {
    float x = st.x;
    float y = st.y;
    float z = st.z;
    float t = st.w;
    
    // Color channel calculations
    // c1 varies based on position and time
    float c1 = c1_scale * (x + y) + c1_offset * t;
    float c2 = c2_value;
    float c3 = c3_value;
    float a = alpha_value;
    
    if (type == 0) {
        // RGB mode - use fract for cycling colors
        return vec4(fract(c1), clamp(c2, 0.0, 1.0), clamp(c3, 0.0, 1.0), clamp(a, 0.0, 1.0));
    } else if (type == 1) {
        // HSV mode - hue wraps around, saturation and value clamped
        vec3 rgb = hsv2rgb(vec3(fract(c1), clamp(c2, 0.0, 1.0), clamp(c3, 0.0, 1.0)));
        return vec4(rgb, clamp(a, 0.0, 1.0));
    } else {
        // Solid color mode
        return vec4(solid_color, clamp(a, 0.0, 1.0));
    }
}

void main() {
    gl_FragColor = color_function(space_time);
}
