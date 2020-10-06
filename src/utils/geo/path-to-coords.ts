import fromECEFToGeodetic from "./from-ecef-to-geodetic";
import {WGS84Params} from "../../constants/geo";
import {fromFeetToMeters, fromMilesToMeters} from "../converters";
import fromGeodeticToECEF from "./from-geodetic-to-ecef";
import {cell} from "../../constants/grid";
import {AirConditions} from "../../types/interfaces";

const b2 = Math.pow(WGS84Params.semiMinorAxis, 2);
const e2 = WGS84Params.firstEccentricitySquared;

export function convertPathToGeodeticCoords(
  path: number[][],
  altInFeet: number,
  initialOffset: { x: number, y: number },
  initialLBHCoords: { lat: number, long: number },
  finalLBHCoords: { lat: number, long: number },
): { lat: number, long: number }[] {
  const newAltInMeters = Math.round(fromFeetToMeters(altInFeet));
  const [initX, initY] = fromGeodeticToECEF(initialLBHCoords.lat, initialLBHCoords.long, newAltInMeters, WGS84Params);
  const [finalX, finalY] = fromGeodeticToECEF(finalLBHCoords.lat, finalLBHCoords.long, newAltInMeters, WGS84Params);

  const xSign = finalX > initX ? 1 : (-1);
  const ySign = finalY > initY ? 1 : (-1);

  const coords = path.map(pathCell => {
    const [cx, cy] = pathCell;
    const actualX = cx - initialOffset.x;
    const actualY = cy - initialOffset.y;
    const xIncInMiles = actualX * cell.H_SIZE;
    const yIncInMiles = actualY * cell.V_SIZE;

    const xIncInMeters = fromMilesToMeters(xIncInMiles);
    const yIncInMeters = fromMilesToMeters(yIncInMiles);

    const pathX = initX + xIncInMeters * xSign;
    const pathY = initY + yIncInMeters * ySign;
    const pathZ = getEllipsisZCoordinate(pathX, pathY, b2, e2);

    const [long, lat] = fromECEFToGeodetic(pathX, pathY, pathZ, WGS84Params);

    return { lat, long };
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

function getEllipsisZCoordinate(x: number, y: number, b2: number, e2: number): number {
  const z2 = b2 + (e2 - 1) * (x * x + y * y);
  const z = Math.abs(Math.sqrt(z2));
  return z;
}
