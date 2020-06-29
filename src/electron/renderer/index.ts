const openFileButton: HTMLButtonElement|null = document.querySelector('.file-selector__button');
const startFinderButton: HTMLButtonElement|null = document.querySelector('.pathfinder-controller__start');
const initialConditionsForm: HTMLFormElement|null = document.querySelector('.initial-conditions__form');

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

if (initialConditionsForm) {
  initialConditionsForm.addEventListener('submit', (event: Event) => {
    event.preventDefault();
    const formFields = initialConditionsForm.querySelectorAll('.initial-conditions__field');

    const initialConditions: Record<string, string> = Array.from(formFields).reduce<Record<string, string>>((acc, field) => {
      const { name, value } = (field as HTMLInputElement);
      acc[name] = value;
      return acc;
    }, {});

    window.electron.applyInitialConditions(initialConditions);
  });
}

window.electron.listenToAirConditionsLoaded();
window.electron.listenToMainAppData();
