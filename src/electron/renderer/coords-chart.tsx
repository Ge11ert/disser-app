import React from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Chart from './chart';

interface Props {
  coords: { lat: number, long: number }[];
  forbiddenZone?: { lat: number, long: number }[];
  startGPSPoint: { lat: number, long: number };
  endGPSPoint: { lat: number, long: number };
}

type AxeSettings = {
  min: number|undefined,
  max: number|undefined,
};

type State = {
  xAxeSettings: AxeSettings,
  yAxeSettings: AxeSettings,
}

const Axes = {
  Y: {
    type: 'lat' as const,
    label: 'Широта',
  },
  X: {
    type: 'long' as const,
    label: 'Долгота',
  },
};

const defaultState: State = {
  xAxeSettings: {
    min: undefined,
    max: undefined,
  },
  yAxeSettings: {
    min: undefined,
    max: undefined,
  },
};

class CoordsChart extends React.Component<Props, State> {
  state: State = defaultState;

  onMinXValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const minValue = event.target.value;
    this.setState((prevState: State) => ({
      xAxeSettings: {
        ...prevState.xAxeSettings,
        min: minValue ? parseFloat(minValue) : undefined,
      }
    }));
  };

  onMaxXValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const maxValue = event.target.value;
    this.setState((prevState: State) => ({
      xAxeSettings: {
        ...prevState.xAxeSettings,
        max: maxValue ? parseFloat(maxValue) : undefined,
      }
    }));
  };

  onMinYValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const minValue = event.target.value;
    this.setState((prevState: State) => ({
      yAxeSettings: {
        ...prevState.yAxeSettings,
        min: minValue ? parseFloat(minValue) : undefined,
      }
    }));
  };

  onMaxYValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const maxValue = event.target.value;
    this.setState((prevState: State) => ({
      yAxeSettings: {
        ...prevState.yAxeSettings,
        max: maxValue ? parseFloat(maxValue) : undefined,
      }
    }));
  };

  resetAxesOptions = () => {
    this.setState(defaultState);
  }

  render() {
    const dataSets = [
      {
        label: 'GPS-координаты',
        data: this.props.coords.map(point => ({
          x: parseFloat(point[Axes.X.type].toFixed(4)),
          y: parseFloat(point[Axes.Y.type].toFixed(4)),
        })),
        showLine: true,
        fill: false,
        backgroundColor: 'darkblue',
      },
      {
        label: 'Начальная точка',
        data: [{
          x: this.props.startGPSPoint[Axes.X.type],
          y: this.props.startGPSPoint[Axes.Y.type],
        }],
        showLine: true,
        fill: false,
        backgroundColor: 'green',
      },
      {
        label: 'Конечная точка',
        data: [{
          x: this.props.endGPSPoint[Axes.X.type],
          y: this.props.endGPSPoint[Axes.Y.type],
        }],
        showLine: true,
        fill: false,
        backgroundColor: 'green',
      }
    ];

    const { xAxeSettings, yAxeSettings } = this.state;

    return (
      <Box>
        <Chart
          width={1200}
          height={1200}
          dataSets={this.props.forbiddenZone ? [
            {
              label: 'Запретная зона',
              data: this.props.forbiddenZone.map(point => ({
                x: parseFloat(point[Axes.X.type].toFixed(4)),
                y: parseFloat(point[Axes.Y.type].toFixed(4)),
              })),
              showLine: false,
              fill: false,
              backgroundColor: 'red',
            },
            ...dataSets,
          ] : dataSets}
          xAxeOptions={{
            scaleLabel: {
              display: true,
              labelString: Axes.X.label,
              fontColor: '#333',
              fontSize: 15,
              lineHeight: '24px',
            },
            ticks: {
              fontColor: '#333',
              min: xAxeSettings.min,
              max: xAxeSettings.max,
            }
          }}
          yAxeOptions={{
            scaleLabel: {
              display: true,
              labelString: Axes.Y.label,
              fontColor: '#333',
              fontSize: 15,
              lineHeight: '24px',
            },
            ticks: {
              fontColor: '#333',
              min: yAxeSettings.min,
              max: yAxeSettings.max,
            }
          }}
        />

        <Box mt={4} ml={7}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                type="text"
                id="x-axis-min"
                name="x-axis-min"
                label={`Минимальная ${Axes.X.label.toLowerCase()}`}
                value={xAxeSettings.min || ''}
                onChange={this.onMinXValueChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                type="text"
                id="x-axis-max"
                name="x-axis-max"
                label={`Максимальная ${Axes.X.label.toLowerCase()}`}
                value={xAxeSettings.max || ''}
                onChange={this.onMaxXValueChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                type="text"
                id="y-axis-min"
                name="y-axis-min"
                label={`Минимальная ${Axes.Y.label.toLowerCase()}`}
                value={yAxeSettings.min || ''}
                onChange={this.onMinYValueChange}
                variant="outlined"
                fullWidth
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                type="text"
                id="y-axis-max"
                name="y-axis-max"
                label={`Максимальная ${Axes.Y.label.toLowerCase()}`}
                value={yAxeSettings.max || ''}
                onChange={this.onMaxYValueChange}
                variant="outlined"
                fullWidth
              />
            </Grid>
          </Grid>

          <FormControl margin="normal">
            <Button
              variant="outlined"
              color="secondary"
              type="reset"
              onClick={this.resetAxesOptions}
            >
              Сбросить
            </Button>
          </FormControl>
        </Box>
      </Box>
    )
  }
}

export default CoordsChart;
