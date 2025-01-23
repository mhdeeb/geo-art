import { LineMaterial } from "./js/LineMaterial.js";

//createLines(instancePositions);
//let r = 5;
//let theta = 10 * i / instancePositions.length * 2 * Math.PI;
//let x = r * Math.sin(Math.SQRT1_2 * theta) * Math.cos(theta);
//let y = r * Math.sin(Math.SQRT1_2 * theta) * Math.sin(theta);
//let p = 2 * Math.PI * i / (count - 1);
//let x = 16 * Math.pow(Math.sin(p), 3);
//let y = 13 * Math.cos(p) - 5 * Math.cos(2 * p) - 2 * Math.cos(3 * p) - Math.cos(4 * p);
// let x = 1.5 * p;
// let y = 1.2 * (Math.pow(p * p, 1 / 3) + Math.sqrt(1 - p * p))

let lineMat = new LineMaterial({
    color: new THREE.Color("#ffffff"),
    linewidth: 0.002,
    transparent: true,
    opacity: 0.01,
    depthWrite: false,
    depthTest: true,
});

function createLines(points) {
    const connectionPositions = [];
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            connectionPositions.push(
                points[i * 3 + 0],
                points[i * 3 + 1],
                points[i * 3 + 2]
            );
            connectionPositions.push(
                points[j * 3 + 0],
                points[j * 3 + 1],
                points[j * 3 + 2]
            );
        }
    }

    const connectionPositionsArray = new Float32Array(connectionPositions);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(connectionPositionsArray, 3)
    );

    const lineSegments = new THREE.LineSegments(geometry, materialLine);

    scene.add(lineSegments);
}
