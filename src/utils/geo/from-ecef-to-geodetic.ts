type GeoModel = {
  semiMajorAxis: number,
  firstEccentricitySquared: number,
};

export default function (x: number, y: number, z: number, geoModel: GeoModel): [number, number, number] {
  let tempLat: number;
  let c: number;
  let s: number;
  let ss: number;
  // ellipsoid params
  const a = geoModel.semiMajorAxis;
  const e2 = geoModel.firstEccentricitySquared;

  // derived params
  const a1 = a * e2;
  const a2 = a1 * a1;
  const a3 = a1 * e2 / 2;
  const a4 = 2.5 * a2;
  const a5 = a1 + a3;
  const a6 = 1 - e2;

  const zp = Math.abs(z);
  const w2 = x*x + y*y;
  const w = Math.sqrt(w2);
  const r2 = w2 + z*z;
  const r = Math.sqrt(r2);
  const s2 = z*z/r2;
  const c2 = w2/r2;
  let u = a2/r;
  let v = a3 - a4 / r;

  if (c2 > 0.3) {
    s = (zp / r) * (1 + c2*(a1 + u + s2*v)/r);
    tempLat = Math.asin(s);
    ss = s*s;
    c = Math.sqrt(1 - ss);
  } else {
    c = (w/r)*(1 - s2*(a5 - u - c2*v)/r);
    tempLat = Math.acos(c);
    ss = 1 - c*c;
    s = Math.sqrt(ss);
  }
  const g = 1 - e2*ss;
  const rg = a/Math.sqrt(g);
  const rf = a6*rg;
  u = w - rg*c;
  v = zp - rf*s;
  const f = c*u + s*v;
  const m = c*v - s*u;
  const p = m / (rf/g + f);

  const B = z < 0.0 ? (tempLat + p)*(-1) : (tempLat + p);
  const H = f + m*p/2;

  const L = Math.atan(y / x);

  return [fromRadToDegrees(L), fromRadToDegrees(B), H];
}

function fromRadToDegrees(value: number): number {
  return value * 180 / Math.PI;
}
