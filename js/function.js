// Spirograph/Hypotrochoid parametric function
// R = radius of fixed circle
// r = radius of rolling circle
// d = distance from center of rolling circle to drawing point
export const tri_func = (dr, R = 1, r = 1.8, d = 13) => {
  const theta = 4 * Math.PI * dr;

  if (r === 0) r = 0.0001;

  // const R = 1;
  // const r = 6;
  // const d = 13;

  const x = (R - r) * Math.cos(theta) + d * Math.cos(((R - r) / r) * theta);
  const y = (R - r) * Math.sin(theta) - d * Math.sin(((R - r) / r) * theta);
  const z = 0;

  return [x, y, z];
};
