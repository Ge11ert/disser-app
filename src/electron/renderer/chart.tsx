import React from 'react';
import ChartJS from 'chart.js';

import type { ChartDataSets, ChartXAxe, ChartYAxe } from 'chart.js';

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 800;

interface Props {
  width?: number;
  height?: number;
  dataSets: ChartDataSets[],
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
          datasets: this.props.dataSets
        },
        options: {
          responsive: false,
          scales: {
            xAxes: [{
              id: 'x-axis',
              type: 'linear',
              position: 'bottom',
              ...this.props.xAxeOptions,
            }],
            yAxes: [{
              id: 'y-axis',
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

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (!this.chart) return;

    if (this.props.xAxeOptions !== prevProps.xAxeOptions || this.props.yAxeOptions !== prevProps.yAxeOptions) {
      this.chart.options.scales = {
        xAxes: [{
          id: 'x-axis',
          type: 'linear',
          position: 'bottom',
          ...this.props.xAxeOptions,
        }],
        yAxes: [{
          id: 'y-axis',
          type: 'linear',
          position: 'left',
          ...this.props.yAxeOptions,
        }],
      };
      this.chart.update({ duration: 0 });
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
