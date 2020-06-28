import { fromDegreesToRad } from '../converters';

type GeoModel = {
  semiMajorAxis: number,
  firstEccentricitySquared: number,
};

export default function (latitude: number, longitude: number, altitude: number, geoModel: GeoModel): [number, number, number] {
  const a = geoModel.semiMajorAxis;
  const e2 = geoModel.firstEccentricitySquared;
  const latInRad = fromDegreesToRad(latitude);
  const longInRad = fromDegreesToRad(longitude);
  const cosB = Math.cos(latInRad);
  const cosL = Math.cos(longInRad);
  const sinB = Math.sin(latInRad);
  const sinL = Math.sin(longInRad);
  const N = a / Math.sqrt(1 - e2 * sinB * sinB);

  const X = (N + altitude) * cosB * cosL;
  const Y = (N + altitude) * cosB * sinL;
  const Z = (N + altitude - e2 * N) * sinB;
  return [X, Y, Z];
}
