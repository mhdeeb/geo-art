import { LineGeometry } from "./js/LineGeometry.js";
import { Line2 } from "./js/Line2.js";
import { getShaderMaterial } from "./js/material.js";
import * as THREE from "./js/three.module.min.js";

import {
  createVertexPositions,
  createEdgePositions,
  createInstancedGeometry,
} from "./js/geometry.js";

import { tri_func } from "./js/function.js";

let default_func = tri_func;

const vertexGeometry = new THREE.CircleGeometry(0.1, 64);
const edgeGeometry = new LineGeometry();

const vertexPositions = createVertexPositions(default_func, 100);
const vertexGeometries = createInstancedGeometry(
  vertexGeometry,
  vertexPositions
);

const edgePositions = createEdgePositions(vertexPositions);
const edgeGeometries = createInstancedGeometry(edgeGeometry, edgePositions);

async function init() {
  const shaderMaterial = await getShaderMaterial();
  scene.add(new THREE.Mesh(vertexGeometry, shaderMaterial));
  scene.add(new Line2(edgeGeometry, shaderMaterial));
}

init();
