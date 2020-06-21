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
