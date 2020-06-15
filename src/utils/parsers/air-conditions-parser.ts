// TODO: сделать модель для ячейки поля и самого поля
import { Reader } from '../../types/interfaces';

type Cell = number|string;
type Row = Cell[];
type Rows = Row[];

export default class AirConditionsParser {
  constructor(
    public pathToFile: string,
    public reader: Reader<Rows>
  ) {}

  async parse(): Promise<Rows> {
    return this.reader.read(this.pathToFile).then(res => {
      return res.result;
    }).catch(error => {
      console.log(`
        Error during air conditions parsing,
          code: ${error.code}
          path: ${this.pathToFile}
      `);
      return [];
    })
  }
}
