import xlsx from 'xlsx';
import path from 'path';
import { StatusCode } from '../../types/interfaces';

const permittedExtensions = ['.xlsx', '.xls'];

export default class FastXlsReader {
  lastFilePath: string|null = null;

  lastWorkbook: xlsx.WorkBook|null = null;

  read(pathToFile: string, opts: { sheet?: string } = {}): Promise<{ status: StatusCode, result: any[][] }> {
    const validationResult = this.validate(pathToFile);

    if (validationResult !== StatusCode.OK) {
      return Promise.reject({ status: validationResult, result: [] });
    }

    const workbook = this.lastWorkbook && pathToFile === this.lastFilePath
      ? this.lastWorkbook
      : xlsx.readFile(pathToFile);
    const sheetName = opts.sheet || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const parseResult: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    return Promise.resolve({ status: StatusCode.OK, result: parseResult });
  }

  getSheetsList(pathToFile: string): Promise<{ status: StatusCode, result: { name: string}[] }> {
    const validationResult = this.validate(pathToFile);

    if (validationResult !== StatusCode.OK) {
      return Promise.reject({ status: validationResult, result: [] });
    }

    try {
      const workbook = this.lastWorkbook && pathToFile === this.lastFilePath
        ? this.lastWorkbook
        : xlsx.readFile(pathToFile);
      const sheets = workbook.SheetNames.map(sheet => ({ name: sheet }));
      this.lastFilePath = pathToFile;
      this.lastWorkbook = workbook;
      return Promise.resolve({ status: StatusCode.OK, result: sheets });
    } catch (error) {
      console.log(error);
      let status: StatusCode;
      switch (error.code) {
        case 'ENOENT':
          status = StatusCode.NOT_FOUND;
          break;
        case 'EISDIR':
          status = StatusCode.NOT_EXCEL;
          break;
        default:
          status = StatusCode.INTERNAL_ERROR;
          break;
      }
      return Promise.resolve({ status, result: [] });
    }
  }

  private validate(pathToFile: string): StatusCode {
    if (!pathToFile) return StatusCode.EMPTY_REQUEST;

    const extension = path.extname(pathToFile);

    if (!permittedExtensions.includes(extension)) {
      return StatusCode.NOT_EXCEL;
    }

    return StatusCode.OK;
  }
}
