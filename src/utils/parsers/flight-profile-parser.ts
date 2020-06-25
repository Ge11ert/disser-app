import type {
  Reader,
  FlightProfile,
  CruiseProfile,
  ClimbProfile,
  FlightProfileDataRow,
} from '../../types/interfaces';

type TypeName = 'cruise' | 'climb';
type ProfileType<T> = T extends 'climb' ? ClimbProfile : CruiseProfile;

export default class FlightProfileParser {
  constructor(
    private pathToFile: string,
    private reader: Reader<FlightProfile>
  ) {}

  async parse<T extends TypeName>(): Promise<ProfileType<T>> {
    return this.reader.read(this.pathToFile).then((res) => {
      const dataWithHeaders = res.result;
      const dataWithoutHeaders = dataWithHeaders
        .filter((row): row is FlightProfileDataRow => (!row.every(isString)));
      const formattedData = dataWithoutHeaders.map(row => (
        row.map(item => (typeof item === 'number' ? item : parseFloat(item)))
      ));
      return formattedData as ProfileType<T>;
    });
  }
}

function isString(item: any): item is string {
  return (typeof item === 'string' || item instanceof String);
}
