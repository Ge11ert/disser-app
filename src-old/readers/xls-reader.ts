import readXlsxFile, { ParsedResult } from 'read-excel-file/node'

export default class XlsReader {
  read(pathToFile: string): Promise<ParsedResult> {
    // TODO: добавить проверку на существование файла и то, что он доступен для чтения
    return readXlsxFile(pathToFile).then((rows: ParsedResult) => {
      console.log(rows);
      return rows;
    });
  }
}
