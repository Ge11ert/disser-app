import React from 'react';
import { SVG, Svg, Shape } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.panzoom.js';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { green, blue, red, grey, deepPurple } from '@material-ui/core/colors';

import type { AirConditions, AirConditionsCell } from '../../types/interfaces';
import ButtonGroup from "@material-ui/core/ButtonGroup";

interface Props {
  air: AirConditions;
  disableWind?: boolean;
  dataSets: Record<'fuel'|'time'|'combined'|'rta', {
    path: number[][],
  }>;
  initialPoints?: { entry: { x: number, y: number }, exit: { x: number, y: number }}
}

type State = {
  showWind: boolean,
  showBlockedAreas: boolean,
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

class AirConditionsTable extends React.Component<Props, State> {
  state: State;

  container = React.createRef<HTMLDivElement>();

  draw: Svg = SVG();

  width: number;

  height: number;

  conWidth: number;

  conHeight: number;

  cellSize: number = 15;

  markSize: number = 12;

  cellOffset = 0.5;

  defaultZoom = 1;

  currentZoom = this.defaultZoom;

  scaleFactor = 1.5;

  windCells: Shape[] = [];

  blockCells: Shape[] = [];

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

    this.state = {
      showWind: !props.disableWind,
      showBlockedAreas: true,
    };
  }

  componentDidMount() {
    this.attachGrid();
    this.drawGrid();
  }

  attachGrid = () => {
    if (this.container.current) {
      this.draw
        .addTo(this.container.current)
        .size(this.conWidth, this.conHeight)
        .viewbox(`0 0 ${this.conWidth} ${this.conHeight}`)
        .transform({
          rotate: -90,
        })
        .panZoom({
          wheelZoom: false,
        });
    }
  };

  drawGrid = () => {
    const { dataSets, disableWind, initialPoints } = this.props;

    const showAirConditions = Object.keys(dataSets).length === 1;

    this.draw.clear();

    this.props.air.forEach((row, rowIndex) => {
      row.forEach((cellValue, cellIndex) => {
        const x = cellIndex * this.cellSize + this.cellOffset;
        const y = rowIndex * this.cellSize + this.cellOffset;
        const cellType = getCellType(cellValue);

        this.draw.rect(this.cellSize, this.cellSize)
          .move(x, y).fill('none').stroke(grey[600]);

        if (showAirConditions && cellType === 'wind' && !disableWind && cellValue !== 0) {
          const label = this.draw.circle(this.markSize)
            .move(x + 2, y + 2).fill({ color: getFillColor(cellValue), opacity: 0.9 });
          this.windCells.push(label);
        }

        if (showAirConditions && cellType === 'block') {
          const label = this.draw.circle(this.markSize)
            .move(x + 2, y + 2).fill({ color: getFillColor(cellValue), opacity: 0.9 });
          this.blockCells.push(label);
        }
      });
    });

    Object.entries(dataSets).forEach(([key, value]) => {
      const { path } = value;
      const pathColor = colors[key].primary;
      path.forEach(cell => {
        const [cx, cy] = cell;
        const x = cx * this.cellSize + this.cellOffset;
        const y = cy * this.cellSize + this.cellOffset;
        this.draw.circle(this.markSize)
          .move(x + 2, y + 2).fill({ color: pathColor });
      });
    });

    if (initialPoints !== undefined) {
      const entryX = initialPoints.entry.x * this.cellSize + this.cellOffset;
      const entryY = initialPoints.entry.y * this.cellSize + this.cellOffset;
      const exitX = initialPoints.exit.x * this.cellSize + this.cellOffset;
      const exitY = initialPoints.exit.y * this.cellSize + this.cellOffset;

      this.draw.circle(this.markSize)
        .move(entryX + 2, entryY + 2).fill({ color: deepPurple[500] });
      this.draw.circle(this.markSize)
        .move(exitX + 2, exitY + 2).fill({ color: deepPurple[500] });
    }
  };

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

  toggleWind = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ showWind: event.target.checked }, () => {
      if (this.state.showWind) {
        this.windCells.forEach(cell => (!cell.visible() ? cell.show() : false));
      } else {
        this.windCells.forEach(cell => (cell.visible() ? cell.hide() : false));
      }
    });
  };

  toggleBlockedAreas = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ showBlockedAreas: event.target.checked }, () => {
      if (this.state.showBlockedAreas) {
        this.blockCells.forEach(cell => (!cell.visible() ? cell.show() : false));
      } else {
        this.blockCells.forEach(cell => (cell.visible() ? cell.hide() : false));
      }
    });
  };

  render() {
    return (
      <Box>
        <Box display="flex">
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

          <Box ml={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.showWind}
                  onChange={this.toggleWind}
                  color="primary"
                  name="wind"
                  disabled={this.props.disableWind}
                />
              }
              label="Показывать ветер"
            />
          </Box>

          <Box ml={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={this.state.showBlockedAreas}
                  onChange={this.toggleBlockedAreas}
                  color="primary"
                  name="blocked-areas"
                />
              }
              label="Показывать запретные зоны"
            />
          </Box>
        </Box>

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
