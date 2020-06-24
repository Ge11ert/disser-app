import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';

const mainElement = document.createElement('div');
document.body.appendChild(mainElement);

ReactDOM.render(<App/>, mainElement);

const openFileButton: HTMLButtonElement|null = document.querySelector('.file-selector__button');
const startFinderButton: HTMLButtonElement|null = document.querySelector('.pathfinder-controller__start');

if (openFileButton) {
  openFileButton.addEventListener('click', () => {
    window.electron.loadAirConditions();
  });
}

if (startFinderButton) {
  startFinderButton.addEventListener('click', () => {
    window.electron.findPath();
  });
}

window.electron.listenToAirConditionsLoaded();
window.electron.listenToMainAppData();
