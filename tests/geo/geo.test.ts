import fromGeodeticToECEF from '../../src/utils/geo/from-geodetic-to-ecef';
import fromECEFToGeodetic from '../../src/utils/geo/from-ecef-to-geodetic';
import { WGS84Params } from '../../src/constants/geo';

describe('Convert geodetic to ECEF', () => {
  it('should convert lat, long, alt (all positive)', () => {
    const lat = 37.6155600;
    const long = 55.752200;
    const H = 400;
    const coords = fromGeodeticToECEF(lat, long, H, WGS84Params);

    expectCoords(coords).toBe(['2847015.253', '4181747.095', '3871975.744']);
  });

  it('should convert lat, long, alt (negative latitude)', () => {
    const lat = -33.918861;
    const long = 18.423300;
    const H = 400;
    const coords = fromGeodeticToECEF(lat, long, H, WGS84Params);

    expectCoords(coords).toBe(['5027050.727', '1674548.040', '-3539204.812']);
  });

  it('should convert lat, long, alt (negative longitude)', () => {
    const lat = 44.986656;
    const long = -93.258133;
    const H = 400;
    const coords = fromGeodeticToECEF(lat, long, H, WGS84Params);

    expectCoords(coords).toBe(['-256830.716', '-4511617.936', '4486582.466']);
  });

  it('should convert lat, long, alt (negative altitude)', () => {
    const lat = 37.6155600;
    const long = 55.752200;
    const H = -400;
    const coords = fromGeodeticToECEF(lat, long, H, WGS84Params);

    expectCoords(coords).toBe(['2846658.624', '4181223.272', '3871487.456']);
  });
});

describe('Convert ECEF to geodetic', () => {
  it('should convert XYZ to lat, long, alt', () => {
    const X = 2847015;
    const Y = 4181747;
    const Z = 3871975;

    const coords = fromECEFToGeodetic(X, Y, Z, WGS84Params);
    expectCoords(coords).toBe(['55.752', '37.616', '399.371']);
  });
});

function expectCoords(result: [number, number, number]) {
  const [a1, a2, a3] = result;
  return {
    toBe(expected: [string, string, string]) {
      expect(a1.toFixed(3)).toBe(expected[0]);
      expect(a2.toFixed(3)).toBe(expected[1]);
      expect(a3.toFixed(3)).toBe(expected[2]);
    }
  }
}
