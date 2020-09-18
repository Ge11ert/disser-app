import fromECEFToGeodetic from "./from-ecef-to-geodetic";
import {WGS84Params} from "../../constants/geo";
import {fromFeetToMeters, fromMilesToMeters} from "../converters";
import fromGeodeticToECEF from "./from-geodetic-to-ecef";
import {cell} from "../../constants/grid";
import {AirConditions} from "../../types/interfaces";

export function convertPathToGeodeticCoords(
  path: number[][],
  altInFeet: number,
  initialOffset: { x: number, y: number },
  initialLBHCoords: { lat: number, long: number },
): { lat: number, long: number }[] {
  const newAltInMeters = Math.round(fromFeetToMeters(altInFeet));
  const [initX, initY, initZ] = fromGeodeticToECEF(initialLBHCoords.lat, initialLBHCoords.long, newAltInMeters, WGS84Params);
  let currentZ = initZ;

  const coords = path.map(pathCell => {
    const [cx, cy] = pathCell;
    const actualX = cx - initialOffset.x;
    const actualY = cy - initialOffset.y;
    const xIncInMiles = actualX * cell.H_SIZE;
    const yIncInMiles = actualY * cell.V_SIZE;

    const xIncInMeters = fromMilesToMeters(xIncInMiles);
    const yIncInMeters = fromMilesToMeters(yIncInMiles);

    const pathX = initX - yIncInMeters;
    const pathY = initY - xIncInMeters;
    const pathZ = currentZ;

    const [long, lat] = fromECEFToGeodetic(pathX, pathY, pathZ, WGS84Params);
    const [, , newZ] = fromGeodeticToECEF(lat, long, newAltInMeters, WGS84Params);
    currentZ = newZ;

    return { lat, long };
  });

  return coords;
}

export function convertZoneToCoords(
  airConditions: AirConditions,
  altInFeet: number,
  initialOffset: { x: number, y: number },
  initialLBHCoords: { lat: number, long: number },
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

  return convertPathToGeodeticCoords(forbiddenZonePoints, altInFeet, initialOffset, initialLBHCoords);
}

function isEven(num: number): boolean {
  return num % 2 === 0;
}
