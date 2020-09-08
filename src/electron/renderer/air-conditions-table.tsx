import React from 'react';
import { SVG, Svg } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.panzoom.js';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { green, blue, red, grey, deepPurple } from '@material-ui/core/colors';

import type { AirConditions, AirConditionsCell } from '../../types/interfaces';
import ButtonGroup from "@material-ui/core/ButtonGroup";

interface Props {
  air: AirConditions;
  disableWind?: boolean;
  path?: number[][],
}

class AirConditionsTable extends React.Component<Props, {}> {
  container = React.createRef<HTMLDivElement>();

  draw: Svg = SVG();

  width: number;

  height: number;

  conWidth: number;

  conHeight: number;

  cellSize: number = 15;

  markSize: number = 12;

  defaultZoom = 1;

  currentZoom = this.defaultZoom;

  scaleFactor = 1.5;

  constructor(props: Props) {
    super(props);

    const nY = props.air.length;
    const nX = props.air[0].length;
    const width = Math.floor(nX * this.cellSize);
    const height = Math.floor(nY * this.cellSize);

    this.width = width;
    this.height = height;
    this.conWidth = width + 1;
    this.conHeight = height + 1;
  }

  componentDidMount() {
    const { path } = this.props;

    if (this.container.current) {
      this.draw
        .addTo(this.container.current)
        .size(this.conWidth, this.conHeight)
        .viewbox(`0 0 ${this.conWidth} ${this.conHeight}`)
        .panZoom({
          wheelZoom: false,
        });

      this.props.air.forEach((row, rowIndex) => {
        row.forEach((cellValue, cellIndex) => {
          const x = cellIndex * this.cellSize + 0.5;
          const y = rowIndex * this.cellSize + 0.5;

          this.draw.rect(this.cellSize, this.cellSize)
            .move(x, y).fill('none').stroke(grey[600]);

          if (!(cellValue === 0 || this.props.disableWind)) {
            this.draw.circle(this.markSize)
              .move(x + 2, y + 2).fill({ color: getFillColor(cellValue), opacity: 0.9 });
          }
        });
      });

      if (path !== undefined) {
        path.forEach(cell => {
          const [cx, cy] = cell;
          const x = cx * this.cellSize + 0.5;
          const y = cy * this.cellSize + 0.5;
          this.draw.circle(this.markSize)
            .move(x + 2, y + 2).fill({ color: deepPurple[500] });
        })
      }
    }
  }

  zoomIn = () => {
    const newZoom = this.currentZoom * this.scaleFactor;
    this.draw.zoom(newZoom);
    this.currentZoom = newZoom;
  };

  zoomOut = () => {
    const newZoom = this.currentZoom / this.scaleFactor;
    this.draw.zoom(newZoom);
    this.currentZoom = newZoom;
  };

  resetZoom = () => {
    this.draw.zoom(this.defaultZoom).viewbox(`0 0 ${this.conWidth} ${this.conHeight}`);
  };

  render() {
    return (
      <Box>
        <ButtonGroup color="primary" variant="outlined" size="small">
          <Button onClick={this.zoomIn}>
            Приблизить
          </Button>
          <Button onClick={this.zoomOut}>
            Отдалить
          </Button>
          <Button onClick={this.resetZoom}>
            Сбросить
          </Button>
        </ButtonGroup>

        <Box mt={2}>
          <div ref={this.container}/>
        </Box>
      </Box>
    );
  }
}

export default AirConditionsTable;

function getFillColor(cellValue: AirConditionsCell): string {
  if (getCellType(cellValue) === 'block') {
    return red[300];
  }

  return cellValue < 0 ? blue[100] : green[100];
}

function getCellType(cellValue: AirConditionsCell): 'wind'|'block' {
  return typeof cellValue === 'string' ? 'block' : 'wind';
}
