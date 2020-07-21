import type {
  Reader,
  FlightProfile,
  CruiseProfile,
  ClimbDescentProfile,
  FlightProfileDataRow,
} from '../../types/interfaces';

type TypeName = 'cruise' | 'climb';
type ProfileType<T> = T extends 'climb' ? ClimbDescentProfile : CruiseProfile;

const cruiseProfileNames: Record<number, string> = {
  0: 'speedM',
  1: 'speedOfSound',
  2: 'altitude',
  3: 'fuel',
  4: 'speedV'
};

const climbProfileNames: Record<number, string> = {
  0: 'speedM',
  1: 'speedOfSound',
  2: 'altitude',
  3: 'fuelFrom0',
  4: 'fuelFromPrev',
  5: 'distanceFrom0',
  6: 'distanceFromPrev',
  7: 'speedV',
  8: 'time',
}

export default class FlightProfileParser {
  constructor(
    private pathToFile: string,
    private reader: Reader<FlightProfile>,
    private profileType: TypeName,
  ) {}

  async parse<T extends TypeName>(): Promise<ProfileType<T>> {
    return this.reader.read(this.pathToFile).then((res) => {
      const dataWithHeaders = res.result;
      const dataWithoutHeaders = dataWithHeaders
        .filter((row): row is FlightProfileDataRow => (!row.every(isString)));
      const formattedData = dataWithoutHeaders.map(row => (
        row.map(item => (typeof item === 'number' ? item : parseFloat(item)))
      ));
      const profileData = formattedData.map((row) => {
        return row.reduce<Record<string, number>>((acc, item, index) => {
          const name = this.profileType === 'climb' ? climbProfileNames[index] : cruiseProfileNames[index];
          acc[name] = item;
          return acc;
        }, {});
      });
      return (profileData as ProfileType<T>);
    });
  }
}

function isString(item: any): item is string {
  return (typeof item === 'string' || item instanceof String);
}
