import path from 'path';
import { promises as fs } from 'fs';
import FastXlsReader from '../../src/utils/readers/fast-xls-reader';
import AirConditionsParser from '../../src/utils/parsers/air-conditions-parser';

describe('Parse excel file with air conditions', () => {
  it('should parse standard-size file', async (done) => {
    const sourceFile = path.resolve(__dirname, 'fixtures/air_conditions_standard.xlsx');
    const reader = new FastXlsReader();
    const parser = new AirConditionsParser(sourceFile, reader);
    const result = await parser.parse();

    const fixtureJson = await fs.readFile(path.resolve(__dirname, 'fixtures/air_conditions_standard.json'), { encoding: 'utf-8' });
    const resultJson = JSON.stringify(Array.from(result));

    expect(resultJson).toEqual(fixtureJson);
    done();
  }, 10000);

  it('should parse large-size file', async (done) => {
    const sourceFile = path.resolve(__dirname, 'fixtures/air_conditions_large.xlsx');
    const reader = new FastXlsReader();
    const parser = new AirConditionsParser(sourceFile, reader);
    const result = await parser.parse();

    const fixtureJson = await fs.readFile(path.resolve(__dirname, 'fixtures/air_conditions_large.json'), { encoding: 'utf-8' });
    const resultJson = JSON.stringify(Array.from(result));

    expect(resultJson).toEqual(fixtureJson);
    done();
  }, 50000);
});
