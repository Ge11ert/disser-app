import React from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Chart from './chart';

type CoordsSet = { lat: number, long: number }[];

interface Props {
  startGPSPoint: { lat: number, long: number };
  endGPSPoint: { lat: number, long: number };
  dataSets: Record<'fuel'|'time'|'combined'|'rta', {
    coords: CoordsSet;
    forbiddenZone?: CoordsSet;
  }>;
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

const colors: { [type: string]: { primary: string, dark: string } } = {
  fuel: {
    primary: '#1976d2',
    dark: '#004ba0',
  },
  time: {
    primary: '#43a047',
    dark: '#00701a',
  },
  combined: {
    primary: '#f4511e',
    dark: '#b91400',
  },
  rta: {
    primary: '#fbc02d',
    dark: '#c49000',
  },
  defaultColor: {
    primary: '#999',
    dark: 'darkblue',
  },
};

const labels: Record<string, string> = {
  fuel: 'Минимум топлива',
  time: 'Минимум времени',
  combined: 'Смешанный критерий',
  rta: 'Минимум задержки прибытия',
  defaultLabel: 'GPS-координаты',
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
  };

  render() {
    const coordsDataSets = this.props.dataSets;

    const pathsWithForbiddenZone = Object.values(coordsDataSets).filter(path => !!path.forbiddenZone);
    const forbiddenZone = pathsWithForbiddenZone.length === 1
      ? ({
        label: 'Запретная зона',
        data: (pathsWithForbiddenZone[0].forbiddenZone as CoordsSet).map(point => ({
          x: parseFloat(point[Axes.X.type].toFixed(4)),
          y: parseFloat(point[Axes.Y.type].toFixed(4)),
        })),
        showLine: false,
        fill: false,
        backgroundColor: 'red',
        borderColor: 'red',
      }) : undefined;

    const dataSets = [
      ...(Object.entries(coordsDataSets).map(([key, value]) => {
        const useDifferentAppearance = Object.keys(coordsDataSets).length > 1;
        const chartColor = useDifferentAppearance ? (colors[key] || colors.defaultColor) : colors.defaultColor;
        const coords = value.coords;

        return ({
          label: useDifferentAppearance ? labels[key] : labels.defaultLabel,
          data: coords.map(point => ({
            x: parseFloat(point[Axes.X.type].toFixed(4)),
            y: parseFloat(point[Axes.Y.type].toFixed(4)),
          })),
          showLine: true,
          fill: false,
          borderColor: chartColor.primary,
          backgroundColor: chartColor.dark,
        })
      })),
      ...(forbiddenZone ? [forbiddenZone] : []),
      {
        label: 'skip',
        data: [{
          x: this.props.startGPSPoint[Axes.X.type],
          y: this.props.startGPSPoint[Axes.Y.type],
        }],
        showLine: true,
        fill: false,
        backgroundColor: 'black',
        borderColor: 'black',
      },
      {
        label: 'skip',
        data: [{
          x: this.props.endGPSPoint[Axes.X.type],
          y: this.props.endGPSPoint[Axes.Y.type],
        }],
        showLine: true,
        fill: false,
        backgroundColor: 'black',
        borderColor: 'black',
      }
    ];

    const { xAxeSettings, yAxeSettings } = this.state;

    return (
      <Box>
        <Chart
          width={1200}
          height={1200}
          dataSets={dataSets}
          xAxeOptions={{
            scaleLabel: {
              display: true,
              labelString: Axes.X.label,
              fontColor: '#333',
              fontSize: Chart.baseFontSize,
              lineHeight: Chart.baseLineHeight,
            },
            ticks: {
              fontColor: '#333',
              min: xAxeSettings.min,
              max: xAxeSettings.max,
              fontSize: Chart.baseFontSize,
            }
          }}
          yAxeOptions={{
            scaleLabel: {
              display: true,
              labelString: Axes.Y.label,
              fontColor: '#333',
              fontSize: Chart.baseFontSize,
              lineHeight: Chart.baseLineHeight,
            },
            ticks: {
              fontColor: '#333',
              min: yAxeSettings.min,
              max: yAxeSettings.max,
              fontSize: Chart.baseFontSize,
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
