import { wgs84ToGK, gkToWGS84 } from './gauss-kruger';
import { fromMilesToMeters } from '../converters';
import { cell } from '../../constants/grid';

import { AirConditions } from '../../types/interfaces';

export function convertPathToGeodeticCoords(
  path: number[][],
  altInFeet: number,
  initialOffset: { x: number, y: number },
  initialLBHCoords: { lat: number, long: number },
  finalLBHCoords: { lat: number, long: number },
): { lat: number, long: number }[] {
  const { x: initialX, y: initialY } = wgs84ToGK({ latitude: initialLBHCoords.lat, longitude: initialLBHCoords.long });
  const { x: finalX, y: finalY } = wgs84ToGK({ latitude: finalLBHCoords.lat, longitude: finalLBHCoords.long });

  const xSign = finalX > initialX ? 1 : (-1);
  const ySign = finalY > initialY ? 1 : (-1);

  const coords = path.map(pathCell => {
    const [cx, cy] = pathCell;
    const actualX = cx - initialOffset.x;
    const actualY = cy - initialOffset.y;

    const xIncInMiles = actualX * cell.H_SIZE;
    const yIncInMiles = actualY * cell.V_SIZE;
    const xIncInMeters = fromMilesToMeters(xIncInMiles);
    const yIncInMeters = fromMilesToMeters(yIncInMiles);

    const pathX = initialX + xIncInMeters * xSign;
    const pathY = initialY + yIncInMeters * ySign;

    const latlong = gkToWGS84({ x: pathX, y: pathY });
    return {
      lat: latlong.latitude,
      long: latlong.longitude,
    };
  });

  return coords;
}

export function convertZoneToCoords(
  airConditions: AirConditions,
  altInFeet: number,
  initialOffset: { x: number, y: number },
  initialLBHCoords: { lat: number, long: number },
  finalLBHCoords: { lat: number, long: number },
): { lat: number, long: number }[] {
  const forbiddenZonePoints: number[][] = [];

  airConditions.forEach((row, rIndex) => {
    if (isEven(rIndex + 1)) {
      for (let i = row.length - 1; i >= 0; i--) {
        if (typeof row[i] === 'string') {
          forbiddenZonePoints.push([i, rIndex]);
        }
      }
    } else {
      row.forEach((c, cellIndex) => {
        if (typeof c === 'string') {
          forbiddenZonePoints.push([cellIndex, rIndex]);
        }
      });
    }
  });

  return convertPathToGeodeticCoords(forbiddenZonePoints, altInFeet, initialOffset, initialLBHCoords, finalLBHCoords);
}

function isEven(num: number): boolean {
  return num % 2 === 0;
}
