import React from 'react';
import format from 'date-fns/esm/format';
import startOfMinute from 'date-fns/esm/startOfMinute';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import Grid from '@material-ui/core/Grid';
import MaskedTextField from './masked-text-field';

type State = {
  altitude: string,
  initLat: string,
  initLong: string,
  finalLat: string,
  finalLong: string,
  departureTime: string,
  customCostIndex: string,
  formValid: boolean,
};

interface Props {
  onSubmit(
    altitude: number,
    startGPSPoint: { lat: number, long: number },
    endGPSPoint: { lat: number, long: number },
  ): void,
}

const coordsMask = [/\d/, /\d/, '.', /\d/, /\d/, /\d/, /\d/, /\d/, /\d/];
const coordsPlaceholder = '00.000000';

export default class InitialConditions extends React.Component<Props, State> {
  state = {
    altitude: '30 000',
    initLat: '37.6155600',
    initLong: '55.752200',
    finalLat: '53.390321',
    finalLong: '58.757723',
    departureTime: format(startOfMinute(new Date()), 'HH:mm:ss'),
    customCostIndex: '5000',
    formValid: true,
  };

  onAltChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      altitude: event.target.value,
    }, this.validateForm);
  };

  onInitialLatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      initLat: event.target.value,
    }, this.validateForm);
  };

  onInitialLongChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      initLong: event.target.value,
    }, this.validateForm);
  };

  onFinalLatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      finalLat: event.target.value,
    }, this.validateForm);
  };

  onFinalLongChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      finalLong: event.target.value,
    }, this.validateForm);
  };

  onDepartureTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      departureTime: event.target.value,
    }, this.validateForm);
  }

  onCustomCostIndexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      customCostIndex: event.target.value,
    }, this.validateForm);
  }

  validateForm = () => {
    const currentValidity = Object.values(this.state).filter(v => (typeof v === 'string')).every(Boolean);

    if (currentValidity !== this.state.formValid) {
      this.setState({
        formValid: currentValidity,
      });
    }
  };

  onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!this.state.formValid) return;

    const {
      altitude,
      initLat,
      initLong,
      finalLat,
      finalLong,
      departureTime,
      customCostIndex,
    } = this.state;

    const initialConditions = {
      altitude,
      'initial-latitude': initLat,
      'initial-longitude': initLong,
      'final-latitude': finalLat,
      'final-longitude': finalLong,
      'departure-time': departureTime,
      'cost-index': customCostIndex,
    };

    window.electron.applyInitialConditions(initialConditions);
    const parsedAlt = parseInt(altitude.replace(/\s/g, ''), 10);
    const startGPSPoint = {
      lat: parseFloat(initLat),
      long: parseFloat(initLong),
    };
    const endGPSPoint = {
      lat: parseFloat(finalLat),
      long: parseFloat(finalLong),
    };
    this.props.onSubmit(parsedAlt, startGPSPoint, endGPSPoint);
  };

  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <MaskedTextField
              type="text"
              id="altitude"
              name="altitude"
              label="Начальная высота"
              value={this.state.altitude}
              onChange={this.onAltChange}
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Ft</InputAdornment>
                )
              }}
              mask={[/\d/, /\d/, '\u2000', /\d/, /\d/, /\d/]}
              placeholder="30 000"
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              type="text"
              id="weight"
              name="weight"
              label="Начальная масса ВС"
              value="40 000"
              variant="outlined"
              disabled
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Kg</InputAdornment>
                ),
                readOnly: true,
              }}
            />
          </Grid>

          <Grid item xs={6}>
            <MaskedTextField
              type="text"
              id="initial-latitude"
              name="initial-latitude"
              label="Начальная широта"
              value={this.state.initLat}
              onChange={this.onInitialLatChange}
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Deg</InputAdornment>
                )
              }}
              placeholder={coordsPlaceholder}
              mask={coordsMask}
            />
          </Grid>

          <Grid item xs={6}>
            <MaskedTextField
              type="text"
              id="initial-longitude"
              name="initial-longitude"
              label="Начальная долгота"
              value={this.state.initLong}
              onChange={this.onInitialLongChange}
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Deg</InputAdornment>
                )
              }}
              placeholder={coordsPlaceholder}
              mask={coordsMask}
            />
          </Grid>

          <Grid item xs={6}>
            <MaskedTextField
              type="text"
              id="final-latitude"
              name="final-latitude"
              label="Конечная широта"
              value={this.state.finalLat}
              onChange={this.onFinalLatChange}
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Deg</InputAdornment>
                )
              }}
              placeholder={coordsPlaceholder}
              mask={coordsMask}
            />
          </Grid>

          <Grid item xs={6}>
            <MaskedTextField
              type="text"
              id="final-longitude"
              name="final-longitude"
              label="Конечная долгота"
              value={this.state.finalLong}
              onChange={this.onFinalLongChange}
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Deg</InputAdornment>
                )
              }}
              placeholder={coordsPlaceholder}
              mask={coordsMask}
            />
          </Grid>

          <Grid item xs={6}>
            <MaskedTextField
              type="text"
              id="departure-time"
              name="departure-time"
              label="Время отправления"
              value={this.state.departureTime}
              onChange={this.onDepartureTimeChange}
              variant="outlined"
              fullWidth
              placeholder="00:00:00"
              mask={[/\d/, /\d/, ':', /\d/, /\d/, ':', /\d/, /\d/]}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              type="text"
              id="custom-cost-index"
              name="custom-cost-index"
              label="Cost Index"
              value={this.state.customCostIndex}
              onChange={this.onCustomCostIndexChange}
              variant="outlined"
              fullWidth
              placeholder="1000"
            />
          </Grid>
        </Grid>

        <FormControl margin="normal">
          <Button
            variant="outlined"
            color="primary"
            type="submit"
            disabled={!this.state.formValid}
          >
            Подтвердить
          </Button>
        </FormControl>
      </form>
    )
  }
}
