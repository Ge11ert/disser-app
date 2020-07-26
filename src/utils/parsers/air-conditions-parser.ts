import { Reader, readResult, AirConditions } from '../../types/interfaces';

export default class AirConditionsParser {
  constructor(
    private pathToFile: string,
    private reader: Reader<AirConditions>
  ) {}

  async parse(): Promise<Map<number, AirConditions>> {
    try {
      const { result: sheetsList } = await this.reader.getSheetsList(this.pathToFile);
      const sheetReadPromises: Promise<readResult<AirConditions>>[] = [];

      sheetsList.forEach((sheet) => {
        sheetReadPromises.push(this.reader.read(this.pathToFile, { sheet: sheet.name }));
      });

      const airConditionsForAllAltitudes = await Promise.all(sheetReadPromises);
      const airConditionsMap = new Map<number, AirConditions>();

      airConditionsForAllAltitudes.forEach((parseResult, index) => {
        const altValue = parseInt(sheetsList[index].name, 10);
        airConditionsMap.set(altValue, parseResult.result);
      });

      return airConditionsMap;
    } catch (error) {
      console.log(`
        Error during air conditions parsing,
          code: ${error.status}
          path: ${this.pathToFile}
      `);
      return error.result;
    }
  }
}
