// TODO: сделать модель для ячейки поля и самого поля

type Cell = number|string;
type Row = Cell[];
type Rows = Row[];

interface Reader {
  read(path: string): Promise<any[][]>;
}

export default class AirConditionsParser {
  constructor(public pathToFile: string, public reader: Reader) {}

  async parse(): Promise<Rows> {
    try {
      const fileData = await this.reader.read(this.pathToFile);
      return fileData;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
}
