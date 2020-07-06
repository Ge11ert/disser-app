import readXlsxFile, { ParsedResult } from 'read-excel-file/node'
import path from 'path';

export enum StatusCode {
  OK = 'OK',
  NOT_EXCEL = 'NOT_EXCEL',
  EMPTY_REQUEST = 'EMPTY_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

const permittedExtensions = ['.xlsx', '.xls'];

export default class XlsReader {
  read(pathToFile: string): Promise<{ status: StatusCode, result: ParsedResult }> {
    const validationResult = this.validate(pathToFile);

    if (validationResult !== StatusCode.OK) {
      return Promise.reject({ status: validationResult, result: [] });
    }

    return readXlsxFile(pathToFile)
      .then((rows: ParsedResult) => ({ status: StatusCode.OK, result: rows }))
      .catch(error => {
        console.log(error);
        switch (error.code) {
          case 'ENOENT':
            return { status: StatusCode.NOT_FOUND, result: [] };
          case 'EISDIR':
            return { status: StatusCode.NOT_EXCEL, result: [] };
          default:
            return { status: StatusCode.INTERNAL_ERROR, result: [] };
        }
      });
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
