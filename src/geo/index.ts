import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import { cell } from '../constants/grid';
import { wgs84ToGK } from '../utils/geo/gauss-kruger';
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

  public startXYCoords = {
    x: 0,
    y: 0,
  };

  public finalXYCoords = {
    x: 0,
    y: 0,
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
    this.convertStartAndFinalToGaussKruger();

    const distanceInMetersX = Math.abs(this.startXYCoords.x - this.finalXYCoords.x);
    const distanceInMetersY = Math.abs(this.startXYCoords.y - this.finalXYCoords.y);

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

  convertStartAndFinalToGaussKruger() {
    const { startLBHCoords, finalLBHCoords } = this;
    const startGaussCoords = wgs84ToGK({ longitude: startLBHCoords.long, latitude: startLBHCoords.lat });
    const finalGaussCoords = wgs84ToGK({ longitude: finalLBHCoords.long, latitude: finalLBHCoords.lat });

    this.startXYCoords = {
      x: startGaussCoords.x,
      y: startGaussCoords.y,
    };

    this.finalXYCoords = {
      x: finalGaussCoords.x,
      y: finalGaussCoords.y,
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
