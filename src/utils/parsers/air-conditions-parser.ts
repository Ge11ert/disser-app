// TODO: сделать модель для ячейки поля и самого поля
import { Reader, readResult } from '../../types/interfaces';

type Cell = number|string;
type Row = Cell[];
type Rows = Row[];

export default class AirConditionsParser {
  constructor(
    private pathToFile: string,
    private reader: Reader<Rows>
  ) {}

  async parse(): Promise<Rows> {
    return this.reader.read(this.pathToFile).then((res: readResult<Rows>) => {
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
