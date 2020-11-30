import proj4 from 'proj4';
import epsg from 'epsg';

interface ICoordinateSystem {
  MIN_ZONE: number,
  MAX_ZONE: number,
  EPSG_BIAS: number,
}

export const CS_SK42: ICoordinateSystem = {
  MIN_ZONE: 2,
  MAX_ZONE: 32,
  EPSG_BIAS: 28400,
};

export const CS_SK95: ICoordinateSystem = {
  MIN_ZONE: 2,
  MAX_ZONE: 32,
  EPSG_BIAS: 20000,
};

const epsgFromZone = (zone: number, csBias: ICoordinateSystem['EPSG_BIAS']) => `EPSG:${csBias + zone}`;

export function gkToWGS84(coordinates: { x: number, y: number }, coordinateSystem: ICoordinateSystem = CS_SK95) {
  if (!coordinates || typeof coordinates !== 'object') {
    throw new Error('missing or invalid parameter "coordinates"');
  }
  const { x, y } = coordinates;

  const zone = Math.floor(y * 1e-6);
  const proj4Coordinates = {
    x: y, // по неизвестной причине proj4 отдаёт и принимает координаты в перевёрнутом виде относительно СК-95.
    y: x, // т.е. `x` для него это `y`, а `y` — `x`. Значения при этом правильные.
  };
  const projected = proj4(epsg[epsgFromZone(zone, coordinateSystem.EPSG_BIAS)], 'WGS84', proj4Coordinates);
  return {
    longitude: projected.x,
    latitude: projected.y,
  };
}

export function wgs84ToGK(coordinates: { longitude: number, latitude: number }, coordinateSystem: ICoordinateSystem = CS_SK95) {
  if (!coordinates || typeof coordinates !== 'object') {
    throw new Error('missing or invalid parameter "coordinates"');
  }
  const { longitude, latitude } = coordinates;
  const zone = Math.floor(longitude / 6 + 1);

  if (zone < coordinateSystem.MIN_ZONE || zone > coordinateSystem.MAX_ZONE) {
    throw new Error(`Zone "${zone}" out of bounds. Should be between ${coordinateSystem.MIN_ZONE} and ${coordinateSystem.MAX_ZONE}`);
  }

  const proj4Coordinates = {
    x: longitude,
    y: latitude,
  };
  const projected = proj4('WGS84', epsg[epsgFromZone(zone, coordinateSystem.EPSG_BIAS)], proj4Coordinates);

  return {
    x: projected.y,
    y: projected.x,
  };
}
