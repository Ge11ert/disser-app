import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Dialog from './dialog';
import OptimalPathCharts from './optimal-path-charts';
import { formatTime } from './utils';

import { AirConditions, OptimalPath, OptimalPathWithCoords } from '../../types/interfaces';

type OptimalPaths = {
  fuel: OptimalPathWithCoords,
  time: OptimalPathWithCoords,
  combined: OptimalPathWithCoords,
  rta: OptimalPath|null,
};

interface Props {
  air: Map<number, AirConditions>|null;
}

const OptimalPaths = (props: Props) => {
  const [optimalPaths, setOptimalPaths] = React.useState<OptimalPaths|null>(null);
  const [fuelDialogOpen, setFuelDialogOpen] = React.useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = React.useState(false);
  const [combinedDialogOpen, setCombinedDialogOpen] = React.useState(false);

  if (window.electron) {
    window.electron.listenToOptimalPathsFound((result: OptimalPaths) => {
      setOptimalPaths(result);
    });
  }

  if (!optimalPaths) return null;

  const { fuel, time, combined, rta } = optimalPaths;
  const getFuelValue = getValueWithLabel(fuel);
  const getTimeValue = getValueWithLabel(time);
  const getCombinedValue = getValueWithLabel(combined);
  const getRTAValue = rta ? getValueWithLabel(rta) : () => null;

  const toggleFuelDialog = () => {
    setFuelDialogOpen(!fuelDialogOpen);
  };
  const toggleTimeDialog = () => {
    setTimeDialogOpen(!timeDialogOpen);
  };
  const toggleCombinedDialog = () => {
    setCombinedDialogOpen(!combinedDialogOpen);
  };

  return (
    <Box>
      <Box>
        <Typography variant="h5">
          1. Оптимальный по критерию минимума расхода топлива
        </Typography>

        <Box mt={2}>
          <Typography variant="body1">
            {getFuelValue('Стоимость полёта', 'flightCost')}
            <br/>
            {getFuelValue('Высота', 'altitude')}
            <br/>
            {getFuelValue('Скорость', 'speed')}
            <br/>
            {getFuelValue('Дистанция', 'distance')}
            <br/>
            {getFuelValue('Затраты топлива', 'fuel')}
            <br/>
            {getFuelValue('Затраты времени', 'time', formatTime)}
            <br/>
            {getFuelValue('Средний ветер', 'averageWind')}
          </Typography>
        </Box>

        <Box mt={2}>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleFuelDialog}
          >
            Показать графики
          </Button>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography variant="h5">
          2. Оптимальный по критерию минимума времени
        </Typography>

        <Box mt={2}>
          <Typography variant="body1">
            {getTimeValue('Стоимость полёта', 'flightCost')}
            <br/>
            {getTimeValue('Высота', 'altitude')}
            <br/>
            {getTimeValue('Скорость', 'speed')}
            <br/>
            {getTimeValue('Дистанция', 'distance')}
            <br/>
            {getTimeValue('Затраты топлива', 'fuel')}
            <br/>
            {getTimeValue('Затраты времени', 'time', formatTime)}
            <br/>
            {getTimeValue('Средний ветер', 'averageWind')}
          </Typography>
        </Box>

        <Box mt={2}>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleTimeDialog}
          >
            Показать графики
          </Button>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography variant="h5">
          3. Оптимальный по смешанному критерию
        </Typography>

        <Box mt={2}>
          <Typography variant="body1">
            {getCombinedValue('Стоимость полёта', 'flightCost')}
            <br/>
            {getCombinedValue('Высота', 'altitude')}
            <br/>
            {getCombinedValue('Скорость', 'speed')}
            <br/>
            {getCombinedValue('Дистанция', 'distance')}
            <br/>
            {getCombinedValue('Затраты топлива', 'fuel')}
            <br/>
            {getCombinedValue('Затраты времени', 'time', formatTime)}
            <br/>
            {getCombinedValue('Средний ветер', 'averageWind')}
          </Typography>
        </Box>

        <Box mt={2}>
          <Button
            variant="outlined"
            size="small"
            onClick={toggleCombinedDialog}
          >
            Показать графики
          </Button>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography variant="h5">
          4. Оптимальный по критерию минимума задержки прибытия
        </Typography>

        <Box mt={2}>
          { !!rta ? (
            <Typography variant="body1">
              {getRTAValue('Стоимость полёта', 'flightCost')}
              <br/>
              {getRTAValue('Высота', 'altitude')}
              <br/>
              {getRTAValue('Скорость', 'speed')}
              <br/>
              {getRTAValue('Дистанция', 'distance')}
              <br/>
              {getRTAValue('Затраты топлива', 'fuel')}
              <br/>
              {getRTAValue('Затраты времени', 'time', formatTime)}
              <br/>
              {getRTAValue('Средний ветер', 'averageWind')}
            </Typography>
          ) : (
            <Typography variant="body1">
              Для выбранного времени прибытия маршрута не существует или не введено время прибытия.
            </Typography>
          )}
        </Box>
      </Box>

      <Dialog
        isOpen={fuelDialogOpen}
        onClose={toggleFuelDialog}
        title="Графики маршрута, оптимального по топливу"
      >
        <OptimalPathCharts optimalPath={fuel} air={props.air}/>
      </Dialog>

      <Dialog
        isOpen={timeDialogOpen}
        onClose={toggleTimeDialog}
        title="Графики маршрута, оптимального по времени"
      >
        <OptimalPathCharts optimalPath={time} air={props.air}/>
      </Dialog>

      <Dialog
        isOpen={combinedDialogOpen}
        onClose={toggleCombinedDialog}
        title="Графики маршрута, оптимального по смешанному критерию"
      >
        <OptimalPathCharts optimalPath={combined} air={props.air}/>
      </Dialog>
    </Box>
  )
};

export default OptimalPaths;

function getValueWithLabel(pathInfo: OptimalPath) {
  return function (label: string, fieldName: keyof OptimalPath, formatter?: Function) {
    return `${label}: ${formatter ? formatter(pathInfo[fieldName]) : pathInfo[fieldName]}`;
  }
}
