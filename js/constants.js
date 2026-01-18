// ============ CENTRAL DEFAULTS ============
// All default values in one place - change here only

// Time settings
export const DEFAULT_T_LIMIT = 60;
export const DEFAULT_T_MIN = 0;

// Color mode: 0 = RGB, 1 = HSV, 2 = Solid
export const DEFAULT_COLOR_MODE = 0;

// Point settings
export const DEFAULT_POINT_COUNT = 100;
export const DEFAULT_SHOW_POINTS = false;

// Line settings
export const DEFAULT_LINE_WIDTH = 0.3;
export const DEFAULT_SHOW_LINES = true;

// Geometry settings
export const DEFAULT_GEOMETRY_SCALE = 0.4;

// Parametric function parameters (spirograph)
export const DEFAULT_R = 1;      // Fixed circle radius
export const DEFAULT_r = 0;    // Rolling circle radius
export const DEFAULT_d = 13;     // Drawing point distance from center

// Color expressions (GLSL)
export const DEFAULT_C1 = "1.0";
export const DEFAULT_C2 = "1.0";
export const DEFAULT_C3 = "1.0";
export const DEFAULT_ALPHA = "0.2";

// Point color expressions (GLSL)
export const DEFAULT_POINT_C1 = "-.05*(x+y)-10.";
export const DEFAULT_POINT_C2 = "1.0";
export const DEFAULT_POINT_C3 = "1.0";
export const DEFAULT_POINT_ALPHA = "1.0";

// Solid colors
export const DEFAULT_SOLID_COLOR = "#ffffff";
export const DEFAULT_POINT_SOLID_COLOR = "#ffffff";

// Background
export const DEFAULT_BACKGROUND = "#000000";
export const DEFAULT_BACKGROUND_OPACITY = 1;

// Animation
export const DEFAULT_ANIMATE = true;
export const DEFAULT_SPEED_MULTIPLIER = 1;

// Color type labels
export const COLOR_TYPES = ["rgb", "hsv", "solid"];

// Export extensions
export const EXPORT_EXTENSIONS = ["png", "webp", "jpg", "gif", "json"];
