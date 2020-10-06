import React from 'react';
import Chart from './chart';

interface Props {
  coords: { lat: number, long: number }[];
  forbiddenZone?: { lat: number, long: number }[];
  startGPSPoint: { lat: number, long: number };
  endGPSPoint: { lat: number, long: number };
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

class CoordsChart extends React.Component<Props, {}> {
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

    return (
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
          }
        }}
      />
    )
  }
}

export default CoordsChart;
