// renderer js goes here
const textField: HTMLInputElement|null = document.querySelector('.form__field');
const form: HTMLFormElement|null = document.querySelector('.form');

window.electron.listenToMagic();

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!textField) return;
    const value = textField.value;
    window.electron.doMagic(value);
  });
}
