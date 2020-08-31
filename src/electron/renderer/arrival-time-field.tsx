import React from 'react';
import format from 'date-fns/esm/format';
import parseISO from 'date-fns/esm/parseISO';
import isValid from 'date-fns/esm/isValid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import MaskedTextField from './masked-text-field';

type State = {
  arrivalTimeString: string,
  possibleArrivalDates?: { min: Date, max: Date },
  isValid: boolean,
  errorText: string,
};

class ArrivalTimeField extends React.Component<{}, State> {
  state: State = {
    arrivalTimeString: '',
    possibleArrivalDates: undefined,
    isValid: true,
    errorText: '',
  };

  componentDidMount() {
    if (window.electron) {
      window.electron.listenToArrivalTimeRequest((arrivalDates: { min: Date, max: Date }) => {
        this.setState({
          possibleArrivalDates: arrivalDates,
        });
      });
    }
  }

  onArrivalTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      arrivalTimeString: event.target.value,
    }, () => {
      this.setState({
        isValid: true,
        errorText: '',
      });
    });
  };

  validate = () => {
    const { arrivalTimeString } = this.state;

    if (!arrivalTimeString) {
      this.setState({
        isValid: false,
        errorText: 'Обязательное поле',
      });
      return false;
    }

    const currentISODate = format(new Date(), 'yyyy-LL-dd');
    const userArrivalDateString = `${currentISODate}T${arrivalTimeString}`;
    const userDate = parseISO(userArrivalDateString);
    if (!isValid(userDate)) {
      this.setState({
        isValid: false,
        errorText: 'Неверный формат',
      });
      return false;
    }

    return true;
  };

  applyArrivalTime = () => {
    const isValid = this.validate();

    if (!isValid) return;

    window.electron.applyArrivalTime(this.state.arrivalTimeString);
  };

  render() {
    const {
      arrivalTimeString,
      possibleArrivalDates,
      isValid,
      errorText,
    } = this.state;

    if (!possibleArrivalDates) return null;

    return (
      <Box>
        <Typography variant="body1">
          Введите желаемое время прибытия.
        </Typography>
        <Typography>
          Минимальное время:
          {' '}
          {format(possibleArrivalDates.min, 'HH:mm:ss')}
          {'. '}
          Максимальное время:
          {' '}
          {format(possibleArrivalDates.max, 'HH:mm:ss')}
        </Typography>
        <MaskedTextField
          type="text"
          id="arrival-time"
          name="arrival-time"
          label="Время прибытия"
          value={arrivalTimeString}
          onChange={this.onArrivalTimeChange}
          variant="outlined"
          placeholder="00:00:00"
          mask={[/\d/, /\d/, ':', /\d/, /\d/, ':', /\d/, /\d/]}
          {...(!isValid ? ({
            error: true,
            helperText: errorText,
          }) : {})}
        />
        <Button
          variant="outlined"
          color="primary"
          onClick={this.applyArrivalTime}
        >
          Применить
        </Button>
      </Box>
    )
  }
}

export default ArrivalTimeField;
