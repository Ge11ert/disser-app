import React from 'react';
import Chart from './chart';

interface Props {
  coords: { lat: number, long: number }[];
  forbiddenZone?: { lat: number, long: number }[];
  startGPSPoint: { lat: number, long: number };
  endGPSPoint: { lat: number, long: number };
}

class CoordsChart extends React.Component<Props, {}> {
  render() {
    const dataSets = [
      {
        label: 'GPS-координаты',
        data: this.props.coords.map(point => ({
          x: parseFloat(point.lat.toFixed(4)),
          y: parseFloat(point.long.toFixed(4)),
        })),
        showLine: true,
        fill: false,
        backgroundColor: 'darkblue',
      },
      {
        label: 'Начальная точка',
        data: [{
          x: this.props.startGPSPoint.lat,
          y: this.props.startGPSPoint.long,
        }],
        showLine: true,
        fill: false,
        backgroundColor: 'green',
      },
      {
        label: 'Конечная точка',
        data: [{
          x: this.props.endGPSPoint.lat,
          y: this.props.endGPSPoint.long,
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
              x: parseFloat(point.lat.toFixed(4)),
              y: parseFloat(point.long.toFixed(4)),
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
            labelString: 'Долгота',
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
            labelString: 'Широта',
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
