import React from 'react';
import b from 'bem-react-helper';

export default class InitialConditions extends React.Component {
  onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!this.initialConditionsForm.current) return;

    const formFields = this.initialConditionsForm.current.querySelectorAll('.initial-conditions__field');

    const initialConditions: Record<string, string> = Array.from(formFields).reduce<Record<string, string>>((acc, field) => {
      const { name, value } = (field as HTMLInputElement);
      acc[name] = value;
      return acc;
    }, {});

    window.electron.applyInitialConditions(initialConditions);
  };

  initialConditionsForm = React.createRef<HTMLFormElement>();

  render() {
    return (
      <div className={b('initial-conditions')}>
        <p className={b('initial-conditions__header')}>
          Введите начальные условия
        </p>
        <form
          className={b('initial-conditions__form')}
          onSubmit={this.onSubmit}
          ref={this.initialConditionsForm}
        >
          <p className="initial-conditions__form-field">
            <label className="initial-conditions__label" htmlFor="altitude">
              Высота (в футах)
            </label>
            <input
              className="initial-conditions__field"
              type="text"
              id="altitude"
              name="altitude"
              value="30000"
            />
          </p>

          <p className="initial-conditions__form-field">
            <label className="initial-conditions__label" htmlFor="initial-latitude">
              Начальная широта (десят. градусы)
            </label>
            <input
              className="initial-conditions__field"
              type="text"
              id="initial-latitude"
              name="initial-latitude"
              value="37.6155600"
            />
            <span className="initial-conditions__example">
              (Например, 37.6155600)
            </span>
          </p>

          <p className="initial-conditions__form-field">
            <label className="initial-conditions__label" htmlFor="initial-longitude">
              Начальная долгота (десят. градусы)
            </label>
            <input
              className="initial-conditions__field"
              type="text"
              id="initial-longitude"
              name="initial-longitude"
              value="55.752200"
            />
            <span className="initial-conditions__example">
              (Например, 55.752200)
            </span>
          </p>

          <p className="initial-conditions__form-field">
            <label className="initial-conditions__label" htmlFor="final-latitude">
              Конечная широта (десят. градусы)
            </label>
            <input
              className="initial-conditions__field"
              type="text"
              id="final-latitude"
              name="final-latitude"
              value="53.390321"
            />
            <span className="initial-conditions__example">
              (Например, 53.390321)
            </span>
          </p>

          <p className="initial-conditions__form-field">
            <label className="initial-conditions__label" htmlFor="final-longitude">
              Конечная долгота (десят. градусы)
            </label>
            <input
              className="initial-conditions__field"
              type="text"
              id="final-longitude"
              name="final-longitude"
              value="58.757723"
            />
            <span className="initial-conditions__example">
              (Например, 58.757723)
            </span>
          </p>

          <p className="initial-conditions__form-field">
            <button type="submit" className="initial-conditions__submit-button">
              Подтвердить
            </button>
          </p>
        </form>
      </div>
    )
  }
}
