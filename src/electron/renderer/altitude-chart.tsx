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

const HEIGHT_MARGIN = 2000;

class AltitudeChart extends React.Component<Props, {}> {
  render() {
    const { startAltitude, endAltitude, distance } = this.props;
    const minHeight = Math.min(startAltitude, endAltitude) - HEIGHT_MARGIN;
    const maxHeight = Math.max(startAltitude, endAltitude) + HEIGHT_MARGIN;
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
