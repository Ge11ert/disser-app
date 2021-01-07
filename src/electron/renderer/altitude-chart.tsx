import React from 'react';
import Chart from './chart';

interface Props {
  dataSets: Record<'fuel'|'time'|'combined'|'rta', {
    startAltitude: number;
    endAltitude: number;
    distance: {
      climb: number,
      cruise: number,
      descent: number,
    };
  }>;
}

const HEIGHT_MARGIN = 2000;

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
    dark: '#999',
  },
};

const labels: Record<string, string> = {
  fuel: 'Минимум топлива',
  time: 'Минимум времени',
  combined: 'Смешанный критерий',
  rta: 'Минимум задержки прибытия',
  defaultLabel: 'Зависимость высоты от дистанции',
};

class AltitudeChart extends React.Component<Props, {}> {
  render() {
    const dataSets = this.props.dataSets;
    const startAltitudes = Object.values(dataSets).map(set => set.startAltitude);
    const endAltitudes = Object.values(dataSets).map(set => set.endAltitude);
    const minHeight = Math.min(...startAltitudes, ...endAltitudes) - HEIGHT_MARGIN;
    const maxHeight = Math.max(...startAltitudes, ...endAltitudes) + HEIGHT_MARGIN;
    return (
      <Chart
        width={1200}
        height={600}
        dataSets={Object.entries(dataSets).map(([key, value]) => {
          const useDifferentAppearance = Object.keys(dataSets).length > 1;
          const chartColor = useDifferentAppearance ? (colors[key] || colors.defaultColor) : colors.defaultColor;
          return ({
            label: useDifferentAppearance ? labels[key] : labels.defaultLabel,
            data: [
              {
                x: 0,
                y: value.startAltitude,
              },
              {
                x: value.distance.climb,
                y: value.endAltitude,
              },
              {
                x: value.distance.climb + value.distance.cruise,
                y: value.endAltitude,
              },
              {
                x: value.distance.climb + value.distance.cruise + value.distance.descent,
                y: value.startAltitude,
              }
            ],
            showLine: true,
            fill: false,
            cubicInterpolationMode: 'monotone',
            borderColor: chartColor.primary,
            backgroundColor: chartColor.dark,
          });
        })}
        xAxeOptions={{
          scaleLabel: {
            display: true,
            labelString: 'Дистанция, nm',
            fontColor: '#333',
            fontSize: Chart.baseFontSize,
            lineHeight: Chart.baseLineHeight,
          },
          ticks: {
            fontColor: '#333',
            fontSize: Chart.baseFontSize,
          }
        }}
        yAxeOptions={{
          scaleLabel: {
            display: true,
            labelString: 'Высота, ft',
            fontColor: '#333',
            fontSize: Chart.baseFontSize,
            lineHeight: Chart.baseLineHeight,
          },
          ticks: {
            min: minHeight,
            max: maxHeight,
            fontColor: '#333',
            fontSize: Chart.baseFontSize,
          }
        }}
      />
    )
  }
}

export default AltitudeChart;
