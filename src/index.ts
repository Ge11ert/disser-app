import DisserApp from './app';
import appSettings from './app.settings';

const app = new DisserApp(appSettings);

app.startElectronApp();

console.log(`Node env: ${JSON.stringify(process.env)}`);
