import GUI from "./lil-gui.js";
import * as THREE from "./three.module.min.js";
import { controls, renderer, recorder } from "./base.js";
import { updateMaterialShaders, generateFragmentShader } from "./material.js";
import {
    DEFAULT_T_LIMIT,
    DEFAULT_T_MIN,
    DEFAULT_COLOR_MODE,
    DEFAULT_POINT_COUNT,
    DEFAULT_SHOW_POINTS,
    DEFAULT_LINE_WIDTH,
    DEFAULT_SHOW_LINES,
    DEFAULT_GEOMETRY_SCALE,
    DEFAULT_R,
    DEFAULT_r,
    DEFAULT_d,
    DEFAULT_C1,
    DEFAULT_C2,
    DEFAULT_C3,
    DEFAULT_ALPHA,
    DEFAULT_POINT_C1,
    DEFAULT_POINT_C2,
    DEFAULT_POINT_C3,
    DEFAULT_POINT_ALPHA,
    DEFAULT_SOLID_COLOR,
    DEFAULT_POINT_SOLID_COLOR,
    DEFAULT_BACKGROUND,
    DEFAULT_BACKGROUND_OPACITY,
    DEFAULT_ANIMATE,
    DEFAULT_SPEED_MULTIPLIER,
    COLOR_TYPES,
    EXPORT_EXTENSIONS,
} from "./constants.js";

export let recording = false;

// Re-export for backwards compatibility
export const t_limit = DEFAULT_T_LIMIT;
export const base_points = DEFAULT_POINT_COUNT;
export const color_number = DEFAULT_COLOR_MODE;

function reset_advanced() {
    settings.points = base_points;
    settings.interpolate_points = true;
    settings.interpolate_multiplier = 1.5;
}

function reset() {
    settings.animate = false;
    settings.time = settings.t_max;
    settings.speed_multiplier = 1;
}

function reset_camera() {
    controls.reset();
}

function export_func() {
    if (settings.export_ext === EXPORT_EXTENSIONS[0]) {
        renderer.domElement.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("download", `art_${new Date().toISOString()}.png`);
            a.setAttribute("href", url);
            a.click();
            URL.revokeObjectURL(url);
        });
    } else if (settings.export_ext === EXPORT_EXTENSIONS[1]) {
        renderer.domElement.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("download", `art_${new Date().toISOString()}.webp`);
            a.setAttribute("href", url);
            a.click();
            URL.revokeObjectURL(url);
        }, "image/webp");
    } else if (settings.export_ext === EXPORT_EXTENSIONS[2]) {
        renderer.domElement.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("download", `art_${new Date().toISOString()}.jpg`);
            a.setAttribute("href", url);
            a.click();
            URL.revokeObjectURL(url);
        }, "image/jpeg");
    } else if (settings.export_ext === EXPORT_EXTENSIONS[3]) {
        renderer.domElement.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.setAttribute("download", `art_${new Date().toISOString()}.gif`);
            a.setAttribute("href", url);
            a.click();
            URL.revokeObjectURL(url);
        }, "image/gif");
    } else if (settings.export_ext === EXPORT_EXTENSIONS[4]) {
        const json = gui.save();
        const blob = new Blob([JSON.stringify(json)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("download", `art_${new Date().toISOString()}.json`);
        a.setAttribute("href", url);
        a.click();
        URL.revokeObjectURL(url);
    }
}

function record_func() {
    if (recording) {
        record_button.name("Record");
        export_button.enable();
        load_button.enable();
        recorder.stop();
    } else {
        record_button.name("Stop Recording");
        export_button.disable();
        load_button.disable();
        recorder.start();
    }

    recording = !recording;
}

function load_graph() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const json = JSON.parse(e.target.result);
            gui.load(json);
        };
        reader.readAsText(file);
    };
    input.click();
}

export const settings = {
    // Parametric function parameters
    R: DEFAULT_R,
    r: DEFAULT_r,
    d: DEFAULT_d,
    t_min: DEFAULT_T_MIN,
    t_max: DEFAULT_T_LIMIT,
    normalize_parameters: true,
    color_type: COLOR_TYPES[DEFAULT_COLOR_MODE],
    // Line color expressions
    c1: DEFAULT_C1,
    c2: DEFAULT_C2,
    c3: DEFAULT_C3,
    alpha: DEFAULT_ALPHA,
    solid_color: DEFAULT_SOLID_COLOR,
    line_width: DEFAULT_LINE_WIDTH,
    show_lines: DEFAULT_SHOW_LINES,
    // Point settings (separate from lines)
    show_points: DEFAULT_SHOW_POINTS,
    point_count: DEFAULT_POINT_COUNT,
    point_c1: DEFAULT_POINT_C1,
    point_c2: DEFAULT_POINT_C2,
    point_c3: DEFAULT_POINT_C3,
    point_alpha: DEFAULT_POINT_ALPHA,
    point_solid_color: DEFAULT_POINT_SOLID_COLOR,
    // Geometry settings
    geometry_scale: DEFAULT_GEOMETRY_SCALE,
    // Other settings
    points: DEFAULT_POINT_COUNT,
    background: DEFAULT_BACKGROUND,
    background_opacity: DEFAULT_BACKGROUND_OPACITY,
    interpolate_points: true,
    interpolate_multiplier: 1.5,
    reset_advanced,
    animate: DEFAULT_ANIMATE,
    time: DEFAULT_T_LIMIT,
    speed_multiplier: DEFAULT_SPEED_MULTIPLIER,
    reset,
    reset_camera,
    export_ext: EXPORT_EXTENSIONS[0],
    export: export_func,
    record: record_func,
    load_graph,
};

const gui = new GUI();
const load_button = gui.add(settings, "load_graph").name("Load JSON");
gui.close();

const p1 = gui.addFolder("Parametric 1");
const parameters = p1.addFolder("Parameters");
parameters
    .add(settings, "R", 0, 100, 0.1)
    .name("R (fixed)")
    .onChange(() => {
        if (rebuildGeometryCallback) rebuildGeometryCallback();
    });
parameters
    .add(settings, "r", 0, 100, 0.1)
    .name("r (rolling)")
    .onChange(() => {
        if (rebuildGeometryCallback) rebuildGeometryCallback();
    });
parameters
    .add(settings, "d", 0, 100, 0.1)
    .name("d (distance)")
    .onChange(() => {
        if (rebuildGeometryCallback) rebuildGeometryCallback();
    });

let time; // Forward declaration for time controller
let materialLine = null;
let materialCircle = null;
let vertexMesh = null;
let lineMesh = null;
let rebuildGeometryCallback = null;

// Function to set material references from outside
export function setMaterials(lineMat, circleMat) {
    materialLine = lineMat;
    materialCircle = circleMat;
}

// Function to set mesh references from outside
export function setMeshes(vMesh, lMesh) {
    vertexMesh = vMesh;
    lineMesh = lMesh;
}

// Function to set rebuild callback
export function setRebuildCallback(callback) {
    rebuildGeometryCallback = callback;
}

// Helper to check if material has shader uniforms
function hasUniforms(mat) {
    return mat && mat.uniforms;
}

// Function to recompile line shaders
async function recompileLineShaders() {
    if (materialLine) {
        const result = await updateMaterialShaders(
            materialLine,
            null,
            settings.c1,
            settings.c2,
            settings.c3,
            settings.alpha
        );
        if (!result.success) {
            console.error("Line shader error - check your expression syntax");
        }
    }
}

// Function to recompile point shaders
async function recompilePointShaders() {
    if (materialCircle) {
        materialCircle.fragmentShader = generateFragmentShader(
            settings.point_c1,
            settings.point_c2,
            settings.point_c3,
            settings.point_alpha
        );
        materialCircle.needsUpdate = true;
    }
}

const time_min = parameters
    .add(settings, "t_min")
    .name("Min Time")
    .onChange((value) => {
        if (value > settings.t_max) {
            settings.t_max = value;
            time.max(value);
            time_max.updateDisplay();
        }
    })
    .onFinishChange((value) => {
        time.min(value);
        if (hasUniforms(materialLine)) materialLine.uniforms.min_time.value = value;
        if (hasUniforms(materialCircle)) materialCircle.uniforms.min_time.value = value;
    });
const time_max = parameters
    .add(settings, "t_max")
    .name("Max Time")
    .onChange((value) => {
        if (value < settings.t_min) {
            settings.t_min = value;
            time.min(value);
            time_min.updateDisplay();
        }
    })
    .onFinishChange((value) => {
        time.max(value);
        if (hasUniforms(materialLine)) materialLine.uniforms.max_time.value = value;
        if (hasUniforms(materialCircle)) materialCircle.uniforms.max_time.value = value;
    });
parameters.close();

// ============ LINES FOLDER ============
const lines = gui.addFolder("Lines");
lines
    .add(settings, "show_lines")
    .name("Show Lines")
    .onChange((value) => {
        if (lineMesh) lineMesh.visible = value;
    });
lines
    .add(settings, "line_width", 0.0001, 1, 0.0001)
    .name("Line Width")
    .onChange((value) => {
        if (materialLine && materialLine.linewidth !== undefined) {
            materialLine.linewidth = value;
        }
    });

const lineColor = lines.addFolder("Line Color");
lineColor
    .add(settings, "color_type", COLOR_TYPES)
    .name("Color Type")
    .onChange((value) => {
        if (value === COLOR_TYPES[0]) {
            line_c1_ctrl.name("R(x,y,z,t)");
            line_c2_ctrl.name("G(x,y,z,t)");
            line_c3_ctrl.name("B(x,y,z,t)");
            showLineColorControls(true);
            line_solid_color.hide();
            if (hasUniforms(materialLine)) materialLine.uniforms.type.value = 0;
        } else if (value === COLOR_TYPES[1]) {
            line_c1_ctrl.name("H(x,y,z,t)");
            line_c2_ctrl.name("S(x,y,z,t)");
            line_c3_ctrl.name("V(x,y,z,t)");
            showLineColorControls(true);
            line_solid_color.hide();
            if (hasUniforms(materialLine)) materialLine.uniforms.type.value = 1;
        } else {
            showLineColorControls(false);
            line_solid_color.show();
            if (hasUniforms(materialLine)) materialLine.uniforms.type.value = 2;
        }
    });

function showLineColorControls(show) {
    if (show) {
        line_c1_ctrl?.show();
        line_c2_ctrl?.show();
        line_c3_ctrl?.show();
        line_alpha_ctrl?.show();
    } else {
        line_c1_ctrl?.hide();
        line_c2_ctrl?.hide();
        line_c3_ctrl?.hide();
        line_alpha_ctrl?.show();
    }
}

let line_c1_ctrl = lineColor
    .add(settings, "c1")
    .name("R(x,y,z,t)")
    .onFinishChange(() => recompileLineShaders());

let line_c2_ctrl = lineColor
    .add(settings, "c2")
    .name("G(x,y,z,t)")
    .onFinishChange(() => recompileLineShaders());

let line_c3_ctrl = lineColor
    .add(settings, "c3")
    .name("B(x,y,z,t)")
    .onFinishChange(() => recompileLineShaders());

let line_alpha_ctrl = lineColor
    .add(settings, "alpha")
    .name("A(x,y,z,t)")
    .onFinishChange(() => recompileLineShaders());

const line_solid_color = lineColor
    .addColor(settings, "solid_color")
    .name("Solid Color")
    .hide()
    .onChange((value) => {
        if (hasUniforms(materialLine))
            materialLine.uniforms.solid_color.value.set(value);
    });
lineColor.close();

// ============ POINTS FOLDER ============
const points = gui.addFolder("Points");
points
    .add(settings, "show_points")
    .name("Show Points")
    .onChange((value) => {
        if (vertexMesh) vertexMesh.visible = value;
    });
points
    .add(settings, "point_count", 10, 500, 1)
    .name("Point Count")
    .onFinishChange((value) => {
        settings.points = value;
        if (rebuildGeometryCallback) rebuildGeometryCallback();
    });

const pointColor = points.addFolder("Point Color");
let point_color_type = COLOR_TYPES[color_number];
pointColor
    .add({ point_color_type }, "point_color_type", COLOR_TYPES)
    .name("Color Type")
    .onChange((value) => {
        point_color_type = value;
        if (value === COLOR_TYPES[0]) {
            point_c1_ctrl.name("R(x,y,z,t)");
            point_c2_ctrl.name("G(x,y,z,t)");
            point_c3_ctrl.name("B(x,y,z,t)");
            showPointColorControls(true);
            point_solid_color.hide();
            if (hasUniforms(materialCircle)) materialCircle.uniforms.type.value = 0;
        } else if (value === COLOR_TYPES[1]) {
            point_c1_ctrl.name("H(x,y,z,t)");
            point_c2_ctrl.name("S(x,y,z,t)");
            point_c3_ctrl.name("V(x,y,z,t)");
            showPointColorControls(true);
            point_solid_color.hide();
            if (hasUniforms(materialCircle)) materialCircle.uniforms.type.value = 1;
        } else {
            showPointColorControls(false);
            point_solid_color.show();
            if (hasUniforms(materialCircle)) materialCircle.uniforms.type.value = 2;
        }
    });

function showPointColorControls(show) {
    if (show) {
        point_c1_ctrl?.show();
        point_c2_ctrl?.show();
        point_c3_ctrl?.show();
        point_alpha_ctrl?.show();
    } else {
        point_c1_ctrl?.hide();
        point_c2_ctrl?.hide();
        point_c3_ctrl?.hide();
        point_alpha_ctrl?.show();
    }
}

let point_c1_ctrl = pointColor
    .add(settings, "point_c1")
    .name("R(x,y,z,t)")
    .onFinishChange(() => recompilePointShaders());

let point_c2_ctrl = pointColor
    .add(settings, "point_c2")
    .name("G(x,y,z,t)")
    .onFinishChange(() => recompilePointShaders());

let point_c3_ctrl = pointColor
    .add(settings, "point_c3")
    .name("B(x,y,z,t)")
    .onFinishChange(() => recompilePointShaders());

let point_alpha_ctrl = pointColor
    .add(settings, "point_alpha")
    .name("A(x,y,z,t)")
    .onFinishChange(() => recompilePointShaders());

const point_solid_color = pointColor
    .addColor(settings, "point_solid_color")
    .name("Solid Color")
    .hide()
    .onChange((value) => {
        if (hasUniforms(materialCircle))
            materialCircle.uniforms.solid_color.value.set(value);
    });
pointColor.close();

// ============ ANIMATION FOLDER ============
const animation = gui.addFolder("Animation");
animation.add(settings, "animate").name("Animate").listen();
animation
    .add(settings, "speed_multiplier", 0, 10, 0.01)
    .name("Speed Multiplier")
    .listen();
time = animation
    .add(settings, "time", settings.t_min, settings.t_max, 0.01)
    .name("Time")
    .listen()
    .onChange((value) => {
        if (hasUniforms(materialCircle)) materialCircle.uniforms.time.value = value;
        if (hasUniforms(materialLine)) materialLine.uniforms.time.value = value;
    });
animation.add(settings, "reset").name("Reset");
animation.open();

// ============ GENERAL FOLDER ============
const general = gui.addFolder("General");
general.add(settings, "reset_camera").name("Reset Camera");
general
    .addColor(settings, "background")
    .name("Background")
    .listen()
    .onChange(() => {
        renderer.setClearColor(settings.background, settings.background_opacity);
    });
general
    .add(settings, "background_opacity", 0, 1, 0.01)
    .name("Background Opacity")
    .onChange((value) => {
        renderer.setClearColor(settings.background, value);
    });
general
    .add(settings, "normalize_parameters")
    .name("Normalize Parameters")
    .onChange(() => {
        if (hasUniforms(materialLine))
            materialLine.uniforms.normalize_parameters.value =
                settings.normalize_parameters;
        if (hasUniforms(materialCircle))
            materialCircle.uniforms.normalize_parameters.value =
                settings.normalize_parameters;
    });
general
    .add(settings, "geometry_scale", 0.1, 10, 0.1)
    .name("Geometry Scale")
    .onChange((value) => {
        if (vertexMesh) {
            vertexMesh.scale.set(value, value, value);
        }
        if (lineMesh) {
            lineMesh.scale.set(value, value, value);
        }
    });

// ============ EXPORT FOLDER ============
const exp = gui.addFolder("Export");
const export_button = exp.add(settings, "export_ext", EXPORT_EXTENSIONS).name("Extension");
exp.add(settings, "export").name("Export");
exp.close();

const record = exp.addFolder("Record");
const record_button = record.add(settings, "record").name("Record");
record.close();

window.addEventListener("keydown", function (event) {
    switch (event.code) {
        case "KeyT":
            break;
    }
});
