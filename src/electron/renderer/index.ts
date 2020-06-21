const openFileButton: HTMLButtonElement|null = document.querySelector('.file-selector__button');

if (openFileButton) {
  openFileButton.addEventListener('click', () => {
    window.electron.loadAirConditions();
  });
}

window.electron.listenToAirConditionsLoaded();
