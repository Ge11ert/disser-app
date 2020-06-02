// renderer js goes here
const textField: HTMLInputElement|null = document.querySelector('.form__field');
const form: HTMLFormElement|null = document.querySelector('.form');
const openFileButton: HTMLButtonElement|null = document.querySelector('.file-selector__button');

window.electron.listenToMagic();
window.electron.listenToFileSelect();

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!textField) return;
    const value = textField.value;
    window.electron.doMagic(value);
  });
}

if (openFileButton) {
  openFileButton.addEventListener('click', () => {
    window.electron.openFile();
  });
}
