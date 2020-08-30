import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { WGS84Params } from '../constants/geo';
import { cell } from '../constants/grid';
import fromGeodeticToECEF from '../utils/geo/from-geodetic-to-ecef';
import { fromFeetToMeters, fromMetersToMiles } from '../utils/converters';

export default class Geo {
  public startAltInFeet = 0;
  public startAltInMeters = 0;
  public departureDate = new Date();
  public arrivalDate = new Date();

  public startLBHCoords = {
    lat: 0,
    long: 0,
    alt: 0,
  };

  public finalLBHCoords = {
    lat: 0,
    long: 0,
    alt: 0,
  };

  public startXYZCoords = {
    x: 0,
    y: 0,
    z: 0
  };

  public finalXYZCoords = {
    x: 0,
    y: 0,
    z: 0
  };

  public distanceInMeters = {
    x: 0,
    y: 0,
    diagonal: 0,
  };

  public distanceInMiles = {
    x: 0,
    y: 0,
    diagonal: 0,
  };

  public distanceInGridCells = {
    x: 0,
    y: 0
  };

  public pathAngle = 0;

  private coordsLoaded = false;

  applyStartAndFinalCoords(coords: Record<string, string>) {
    this.startAltInFeet = parseInt(coords.altitude.replace(/\s/g, ''), 10);
    this.startAltInMeters = Math.round(fromFeetToMeters(this.startAltInFeet));

    this.startLBHCoords = {
      lat: parseFloat(coords['initial-latitude']),
      long: parseFloat(coords['initial-longitude']),
      alt: parseInt(coords.altitude, 10),
    };
    this.finalLBHCoords = {
      lat: parseFloat(coords['final-latitude']),
      long: parseFloat(coords['final-longitude']),
      alt: parseInt(coords.altitude, 10),
    };

    const currentISODate = format(new Date(), 'yyyy-LL-dd');
    const startISODate = `${currentISODate}T${coords['departure-time']}`;
    this.departureDate = parseISO(startISODate);

    this.coordsLoaded = true;
  }

  applyArrivalDate(arrivalTime: string) {
    const currentISODate = format(new Date(), 'yyyy-LL-dd');
    const endISODate = `${currentISODate}T${arrivalTime}`;
    this.arrivalDate = parseISO(endISODate);
  }

  findDistanceBetweenStartAndEndPoints() {
    this.convertStartAndFinalToECEF();

    const distanceInMetersX = Math.abs(this.startXYZCoords.x - this.finalXYZCoords.x);
    const distanceInMetersY = Math.abs(this.startXYZCoords.y - this.finalXYZCoords.y);

    const distanceInMilesX = fromMetersToMiles(distanceInMetersX);
    const distanceInMilesY = fromMetersToMiles(distanceInMetersY);

    this.distanceInMeters = {
      x: distanceInMetersX,
      y: distanceInMetersY,
      diagonal: Math.hypot(distanceInMetersX, distanceInMetersY),
    };

    this.distanceInMiles = {
      x: distanceInMilesX,
      y: distanceInMilesY,
      diagonal: Math.hypot(distanceInMilesX, distanceInMilesY),
    };

    this.findPathAngle();
  }

  findDistanceInGridCells() {
    const { distanceInMiles } = this;

    const roundedX = Math.round(distanceInMiles.x);
    const roundedY = Math.round(distanceInMiles.y);

    const maxCellsX = Math.ceil(roundedX / cell.H_SIZE);
    const maxCellsY = Math.ceil(roundedY / cell.V_SIZE);

    this.distanceInGridCells.x = maxCellsX;
    this.distanceInGridCells.y = maxCellsY;
  }

  convertStartAndFinalToECEF() {
    const { startLBHCoords, finalLBHCoords, startAltInMeters } = this;
    const [startX, startY, startZ] = fromGeodeticToECEF(startLBHCoords.lat, startLBHCoords.long, startAltInMeters, WGS84Params);
    const [finalX, finalY, finalZ] = fromGeodeticToECEF(finalLBHCoords.lat, finalLBHCoords.long, startAltInMeters, WGS84Params);

    this.startXYZCoords = {
      x: startX,
      y: startY,
      z: startZ,
    };

    this.finalXYZCoords = {
      x: finalX,
      y: finalY,
      z: finalZ,
    };
  }

  findPathAngle() {
    if (this.distanceInMeters.x === 0 || this.distanceInMeters.diagonal === 0) {
      return;
    }

    this.pathAngle = Math.acos(this.distanceInMeters.x / this.distanceInMeters.diagonal); // radians
  }

  isCoordsLoaded(): boolean {
    return this.coordsLoaded;
  }
}
