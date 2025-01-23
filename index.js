import { LineGeometry } from "./js/LineGeometry.js";
import { Line2 } from "./js/Line2.js";
import * as THREE from "./js/three.module.min.js";


let tri_func = (dr) => {
    let theta = 4 * Math.PI * dr;

    let R = 6;
    let r = 4;
    let d = 4;

    let x = (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta);
    let y = (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta);
    let z = 0;

    return new THREE.Vector3(x, y, z);
};

let default_func = tri_func;



const vertexGeometry = new THREE.CircleGeometry(0.1, 64);
const edgeGeometry = new LineGeometry();

const vertexPositions = createVertexPositions(default_func, 100);
const vertexGeometries = createInstancedGeometry(vertexGeometry, vertexPositions);

const edgePositions = createEdgePositions(vertexPositions);
const edgeGeometries = createInstancedGeometry(edgeGeometry, edgePositions);

async function init() {
    const shaderMaterial = await getShaderMaterial();
    scene.add(new THREE.Mesh(vertexGeometry, shaderMaterial));
    scene.add(new Line2(edgeGeometry, shaderMaterial));
}

init();