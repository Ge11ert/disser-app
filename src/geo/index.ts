import { WGS84Params } from '../constants/geo';
import fromGeodeticToECEF from '../utils/geo/from-geodetic-to-ecef';
import { fromFeetToMeters, fromMetersToMiles } from '../utils/converters';

export default class Geo {
  public startAltInFeet = 0;
  public startAltInMeters = 0;

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
    y: 0
  };

  public distanceInMiles = {
    x: 0,
    y: 0,
  };

  private coordsLoaded = false;

  applyStartAndFinalCoords(coords: Record<string, string>) {
    this.startAltInFeet = parseInt(coords.altitude, 10);
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
    this.coordsLoaded = true;
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
    };

    this.distanceInMiles = {
      x: distanceInMilesX,
      y: distanceInMilesY,
    };
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

  isCoordsLoaded(): boolean {
    return this.coordsLoaded;
  }
}
