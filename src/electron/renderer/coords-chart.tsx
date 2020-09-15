import React from 'react';
import Chart from './chart';

interface Props {
  coords: { lat: number, long: number }[],
}

class CoordsChart extends React.Component<Props, {}> {
  render() {
    return (
      <Chart
        dataSet={{
          label: 'GPS-координаты',
          data: this.props.coords.map(point => ({
            x: parseFloat(point.lat.toFixed(4)),
            y: parseFloat(point.long.toFixed(4)),
          })),
          showLine: true,
          fill: false,
          backgroundColor: 'darkblue',
        }}
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
