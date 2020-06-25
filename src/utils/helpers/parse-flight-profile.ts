import path from 'path';
import fs from 'fs';
import FlightProfileParser from '../parsers/flight-profile-parser';
import XlsReader from '../readers/xls-reader';

const sourceDir = path.resolve(__dirname, '../../assets');
const targetDir = sourceDir;
const filesToParse: {name: string, type: 'climb'|'cruise'}[] = [
  { name: 'climb_profile.xlsx', type: 'climb' },
  { name: 'cruise_profile.xlsx', type: 'cruise' },
];

const reader = new XlsReader();

filesToParse.forEach((file) => {
  const pathToFile = path.join(sourceDir, file.name);
  const targetFile = path.join(targetDir, file.name.replace('xlsx', 'json'));
  const parser = new FlightProfileParser(pathToFile, reader);

  parser.parse<typeof file.type>().then((result) => {
    fs.writeFile(targetFile, JSON.stringify(result, null, 2), { encoding: 'utf-8' }, (err) => {
      if (err) {
        console.log(`Write error for ${file.name}`);
        console.log(err);
        return;
      }
      console.log(`Parse of ${file.name} finished`);
    });
  });
});
