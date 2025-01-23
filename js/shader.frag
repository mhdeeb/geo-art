varying vec4 space_time;
uniform int type;

const float PI = 3.14159265359;

vec4 hsv2rgb(vec4 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return vec4(c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y), c.w);
}

vec4 color_function(vec4 space_time) {
    if (type == 0)
        return vec4(c1, c2, c3, a);
    else
        return hsv2rgb(vec4(c1, c2, c3, a));
}

void main() {
    gl_FragColor = color_function(space_time);
}