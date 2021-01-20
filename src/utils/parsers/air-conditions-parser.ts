import { AirConditions, Reader, readResult, StatusCode } from '../../types/interfaces';

class ParseError extends Error {
  constructor(public status?: string) {
    super();
  }
}

export default class AirConditionsParser {
  constructor(
    private pathToFile: string,
    private reader: Reader<AirConditions>
  ) {}

  async parse(): Promise<Map<number, AirConditions>> {
    try {
      const { result: sheetsList, status } = await this.reader.getSheetsList(this.pathToFile);
      const sheetReadPromises: Promise<readResult<AirConditions>>[] = [];

      if (status !== StatusCode.OK) {
        throw new ParseError(status);
      }

      sheetsList.forEach((sheet) => {
        sheetReadPromises.push(this.reader.read(this.pathToFile, { sheet: sheet.name }));
      });

      const airConditionsForAllAltitudes = await Promise.all(sheetReadPromises);
      const airConditionsMap = new Map<number, AirConditions>();

      const notOkResult = airConditionsForAllAltitudes.find(parseResult => parseResult.status !== StatusCode.OK);

      if (notOkResult) {
        throw new ParseError(notOkResult.status);
      }

      airConditionsForAllAltitudes.forEach((parseResult, index) => {
        const altValue = parseInt(sheetsList[index].name, 10);
        airConditionsMap.set(altValue, parseResult.result.filter(row => row.length > 0));
      });

      return airConditionsMap;
    } catch (error) {
      console.log(`
Error during air conditions parsing,
  code: ${error.status}
  path: ${this.pathToFile}`);
      return new Map<number, AirConditions>();
    }
  }
}
