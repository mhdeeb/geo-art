uniform bool normalize_parameters;

uniform vec4 min_point;
uniform float time;
uniform vec4 volume;

varying vec4 space_time;

attribute vec3 instancePosition;

void main() {
    vec3 transformedPosition = position + instancePosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);

    if (normalize_parameters) {
        space_time.x = (position.x - min_point.x) / volume.x;
        space_time.y = (position.y - min_point.y) / volume.y;
        space_time.z = (position.z - min_point.z) / volume.z;
        space_time.w = (time - min_point.w) / min_point.w;
    } else {
        space_time = vec4(position, time);
    }
}