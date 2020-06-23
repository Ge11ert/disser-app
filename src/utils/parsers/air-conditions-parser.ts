import { Reader, readResult, AirConditions } from '../../types/interfaces';

export default class AirConditionsParser {
  constructor(
    private pathToFile: string,
    private reader: Reader<AirConditions>
  ) {}

  async parse(): Promise<AirConditions> {
    return this.reader.read(this.pathToFile).then((res: readResult<AirConditions>) => {
      return res.result;
    }).catch((error: readResult<[]>) => {
      console.log(`
        Error during air conditions parsing,
          code: ${error.status}
          path: ${this.pathToFile}
      `);
      return error.result;
    })
  }
}
