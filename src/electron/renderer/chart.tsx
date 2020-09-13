import React from 'react';
import ChartJS from 'chart.js';

import type { ChartDataSets, ChartXAxe, ChartYAxe } from 'chart.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 800;

interface Props {
  width?: number;
  height?: number;
  dataSet: ChartDataSets,
  xAxeOptions?: ChartXAxe,
  yAxeOptions?: ChartYAxe,
}

class Chart extends React.Component<Props, {}> {
  static defaultProps = {
    xAxeOptions: {},
    yAxeOptions: {},
  };

  canvas = React.createRef<HTMLCanvasElement>();

  width: number;

  height: number;

  chart: ChartJS|null = null;

  constructor(props: Props) {
    super(props);

    this.width = props.width || DEFAULT_WIDTH;
    this.height = props.height || DEFAULT_HEIGHT;
  }

  componentDidMount() {
    if (this.canvas.current) {
      const ctx = this.canvas.current.getContext('2d');

      if (ctx === null) return;

      const chart = new ChartJS(ctx, {
        type: 'scatter',
        data: {
          datasets: [this.props.dataSet]
        },
        options: {
          responsive: false,
          scales: {
            xAxes: [{
              type: 'linear',
              position: 'bottom',
              ...this.props.xAxeOptions,
            }],
            yAxes: [{
              type: 'linear',
              position: 'left',
              ...this.props.yAxeOptions,
            }]
          }
        }
      });

      this.chart = chart;
    }
  }

  render() {
    return (
      <canvas
        ref={this.canvas}
        width={this.width}
        height={this.height}
      />
    )
  }
}

export default Chart;
