declare module 'read-excel-file/node' {
  import { PathLike } from 'fs';
  import { Stream } from 'stream';

  export type SchemaPropertyType =
    | 'Integer'
    | 'URL'
    | 'Email'
    | typeof Date
    | typeof Number
    | typeof Boolean;

  export interface FinalSchemaProperty {
    prop: string;
    type: SchemaPropertyType;
    required?: boolean;
    parse?<T>(value: string): T;
    validate?<T>(value: T): void;
  }

  export interface MiddleSchemaProperty {
    prop: string;
    type: Record<string, SchemaProperty>;
  }

  export type SchemaProperty = FinalSchemaProperty | MiddleSchemaProperty;

  export interface SheetParsingOptions {
    sheet?: number | string;
    properties?: any;
    rowMap?: any;
    isColumnOriented?: boolean;
    transformData?(data: any): any;
  }

  export interface SheetConvertOptions extends SheetParsingOptions {
    schema: Record<string, SchemaProperty>;
  }

  export interface SheetNamesOptions {
    getSheets: boolean;
  }

  export type SheetOptions = SheetParsingOptions | SheetNamesOptions;

  export type ParsedResult = any[][];

  function readXlsxFile(
    input: Stream | PathLike,
    options: SheetNamesOptions
  ): Promise<{ name: string }[]>;
  function readXlsxFile(
    input: Stream | PathLike,
    options: SheetConvertOptions
  ): Promise<ParsedResult>;
  function readXlsxFile(
    input: Stream | PathLike,
    options?: SheetOptions
  ): Promise<ParsedResult>;

  export default readXlsxFile;
}
