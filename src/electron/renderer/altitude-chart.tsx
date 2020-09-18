import React from 'react';
import Chart from './chart';

interface Props {
  startAltitude: number;
  endAltitude: number;
  distance: {
    climb: number,
    cruise: number,
    descent: number,
  };
}

class AltitudeChart extends React.Component<Props, {}> {
  render() {
    const { startAltitude, endAltitude, distance } = this.props;
    return (
      <Chart
        width={1200}
        height={600}
        dataSets={[{
          label: 'Зависимость высоты от дистанции',
          data: [
            {
              x: 0,
              y: startAltitude,
            },
            {
              x: distance.climb,
              y: endAltitude,
            },
            {
              x: distance.climb + distance.cruise,
              y: endAltitude,
            },
            {
              x: distance.climb + distance.cruise + distance.descent,
              y: startAltitude,
            }
          ],
          showLine: true,
          fill: false,
          cubicInterpolationMode: 'monotone',
          borderColor: '#999'
        }]}
        xAxeOptions={{
          scaleLabel: {
            display: true,
            labelString: 'Дистанция, nm',
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
            labelString: 'Высота, ft',
            fontColor: '#333',
            fontSize: 15,
            lineHeight: '24px',
          },
          ticks: {
            min: startAltitude - 2000,
            max: endAltitude + 2000,
            fontColor: '#333',
          }
        }}
      />
    )
  }
}

export default AltitudeChart;
