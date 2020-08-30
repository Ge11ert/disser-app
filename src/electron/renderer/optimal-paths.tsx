import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import { OptimalPath } from '../../types/interfaces';

const optimalMock: OptimalPaths = require('./optimal-mock.json');

type OptimalPaths = {
  fuel: OptimalPath,
  time: OptimalPath,
  combined: OptimalPath,
};

const OptimalPaths = () => {
  const [optimalPaths, setOptimalPaths] = React.useState<OptimalPaths|null>(null);
  if (window.electron) {
    window.electron.listenToOptimalPathsFound((result: OptimalPaths) => {
      setOptimalPaths(result);
    });
  }

  if (!optimalPaths) return null;

  const { fuel, time, combined } = optimalPaths;
  const getFuelValue = getValueWithLabel(fuel);
  const getTimeValue = getValueWithLabel(time);
  const getCombinedValue = getValueWithLabel(combined);

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
            {getFuelValue('Затраты времени', 'time')}
            <br/>
            {getFuelValue('Средний ветер', 'averageWind')}
          </Typography>
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
            {getTimeValue('Затраты времени', 'time')}
            <br/>
            {getTimeValue('Средний ветер', 'averageWind')}
          </Typography>
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
            {getCombinedValue('Затраты времени', 'time')}
            <br/>
            {getCombinedValue('Средний ветер', 'averageWind')}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
};

export default OptimalPaths;

function getValueWithLabel(pathInfo: OptimalPath) {
  return function (label: string, fieldName: keyof OptimalPath) {
    return `${label}: ${pathInfo[fieldName]}`;
  }
}
