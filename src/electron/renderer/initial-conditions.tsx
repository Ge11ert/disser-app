import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import Grid from '@material-ui/core/Grid';

type State = {
  altitude: string,
  initLat: string,
  initLong: string,
  finalLat: string,
  finalLong: string,
  formValid: boolean,
};

export default class InitialConditions extends React.Component<{}, State> {
  state = {
    altitude: '30000',
    initLat: '37.6155600',
    initLong: '55.752200',
    finalLat: '53.390321',
    finalLong: '58.757723',
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
    } = this.state;

    const initialConditions = {
      altitude,
      'initial-latitude': initLat,
      'initial-longitude': initLong,
      'final-latitude': finalLat,
      'final-longitude': finalLong,
    };

    window.electron.applyInitialConditions(initialConditions);
  };

  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField
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
            <TextField
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
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
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
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
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
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
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
