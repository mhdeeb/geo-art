import { LineGeometry } from "./js/LineGeometry.js";
import { Line2 } from "./js/Line2.js";
import { getPointShaderMaterial, getCustomLineMaterial } from "./js/material.js";
import * as THREE from "./js/three.module.min.js";

import {
  createVertexPositions,
  createEdgePositions,
  createInstancedGeometry,
} from "./js/geometry.js";

import { tri_func } from "./js/function.js";

import { scene, stats, startAnimation } from "./js/base.js";
import { settings, setMaterials, setMeshes, setRebuildCallback, recording } from "./js/settings.js";

// Create a parameterized function that uses current settings
const getParametricFunc = () => (dr) => tri_func(dr, settings.R, settings.r, settings.d);

const vertexGeometry = new THREE.CircleGeometry(0.1, 64);

let vertexPositions = null;
let vertexGeometries = null;
let edgePositions = null;
let edgeGeometry = null;
let materialLine = null;
let materialCircle = null;
let vertexMesh = null;
let lineMesh = null;

function buildGeometry(isRebuild = false) {
  vertexPositions = createVertexPositions(getParametricFunc(), settings.point_count);
  vertexGeometries = createInstancedGeometry(vertexGeometry, vertexPositions);
  edgePositions = createEdgePositions(vertexPositions);

  // For rebuilds, dispose old geometry and create fresh one
  // LineGeometry doesn't handle position count changes well when reusing
  if (isRebuild && edgeGeometry) {
    edgeGeometry.dispose();
  }
  edgeGeometry = new LineGeometry();
  edgeGeometry.setPositions(edgePositions);

  return { vertexGeometries, edgeGeometry };
}

function rebuildGeometry() {
  // Rebuild geometry with new point count (pass true to indicate rebuild)
  const { vertexGeometries: newVertexGeom, edgeGeometry: newEdgeGeom } = buildGeometry(true);

  // Update vertex mesh geometry
  if (vertexMesh) {
    vertexMesh.geometry.dispose();
    vertexMesh.geometry = newVertexGeom;
    vertexGeometries = newVertexGeom;
  }

  // Update line mesh - Line2 needs geometry reassigned and distances recomputed
  if (lineMesh) {
    lineMesh.geometry = newEdgeGeom;
    lineMesh.computeLineDistances();
  }
}

async function init() {
  // Build initial geometry
  buildGeometry();

  // Get shader material for points (using point-specific color settings)
  materialCircle = await getPointShaderMaterial(
    settings.point_c1,
    settings.point_c2,
    settings.point_c3,
    settings.point_alpha
  );

  // Get custom line material with line color expressions
  materialLine = getCustomLineMaterial(settings.c1, settings.c2, settings.c3, settings.alpha);
  materialLine.linewidth = settings.line_width;
  materialLine.resolution.set(window.innerWidth, window.innerHeight);

  // Set materials in settings module for GUI control
  setMaterials(materialLine, materialCircle);

  // Create mesh with instanced geometry for vertices
  vertexMesh = new THREE.Mesh(vertexGeometries, materialCircle);
  vertexMesh.visible = settings.show_points;
  vertexMesh.scale.set(settings.geometry_scale, settings.geometry_scale, settings.geometry_scale);
  scene.add(vertexMesh);

  // Create line for edges with Line2 (supports line width)
  lineMesh = new Line2(edgeGeometry, materialLine);
  lineMesh.computeLineDistances();
  lineMesh.visible = settings.show_lines;
  lineMesh.scale.set(settings.geometry_scale, settings.geometry_scale, settings.geometry_scale);
  scene.add(lineMesh);

  // Set mesh references in settings for visibility toggle
  setMeshes(vertexMesh, lineMesh);

  // Set rebuild callback for point count changes
  setRebuildCallback(rebuildGeometry);

  // Update line material resolution on resize
  window.addEventListener("resize", () => {
    materialLine.resolution.set(window.innerWidth, window.innerHeight);
  });

  // Create a recording state object to pass by reference
  const recordingState = { get value() { return recording; } };

  // Start the animation loop
  startAnimation((delta, rec) => {
    if (settings.animate) {
      settings.time += delta * settings.speed_multiplier;
      if (settings.time > settings.t_max) settings.time = settings.t_min;
      else if (settings.time < settings.t_min) settings.time = settings.t_max;
      if (materialCircle && materialCircle.uniforms) {
        materialCircle.uniforms.time.value = settings.time;
      }
      if (materialLine && materialLine.uniforms) {
        materialLine.uniforms.time.value = settings.time;
      }
    }
    stats.update();
  }, recordingState);
}

init();
