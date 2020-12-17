import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Divider from '@material-ui/core/Divider';
import Dialog from './dialog';
import OptimalPathCharts from './optimal-path-charts';
import { formatTime } from './utils';

import { AirConditions, OptimalPath, OptimalPathWithCoords, RtaOptimalPathWithCoords } from '../../types/interfaces';

type OptimalPaths = {
  fuel: OptimalPathWithCoords,
  time: OptimalPathWithCoords,
  combined: OptimalPathWithCoords,
  rta: RtaOptimalPathWithCoords|null,
};

interface Props {
  air: Map<number, AirConditions>|null;
  initialAltitude: number;
  startGPSPoint: { lat: number, long: number };
  endGPSPoint: { lat: number, long: number };
  initialPoints: { entry: { x: number, y: number }, exit: { x: number, y: number } },
}

const OptimalPaths = (props: Props) => {
  const [optimalPaths, setOptimalPaths] = React.useState<OptimalPaths|null>(null);
  const [fuelDialogOpen, setFuelDialogOpen] = React.useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = React.useState(false);
  const [combinedDialogOpen, setCombinedDialogOpen] = React.useState(false);
  const [rtaDialogOpen, setRtaDialogOpen] = React.useState(false);

  if (window.electron) {
    window.electron.listenToOptimalPathsFound((result: OptimalPaths) => {
      setOptimalPaths(result);
    });
    window.electron.listenToRTAPathFound((rtaPath: RtaOptimalPathWithCoords) => {
      if (optimalPaths !== null) {
        setOptimalPaths({
          ...optimalPaths,
          rta: rtaPath,
        });
      }
    });
  }

  if (!optimalPaths) return null;

  const { fuel, time, combined, rta = null } = optimalPaths;
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
  const toggleRtaDialog = () => {
    setRtaDialogOpen(!rtaDialogOpen);
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
          { rta !== null ? (
            <Box>
              <Box mb={1}>
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
              </Box>

              <Typography variant="body1">
                Всего вариантов маршрутов:
                {' '}
                {rta.possibleAlternatives.length}
              </Typography>

              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  id="possible-rta-paths"
                >
                  <Typography variant="body1">
                    Посмотреть другие
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {rta.possibleAlternatives.map(path => {
                      const getPathValue = getValueWithLabel(path);
                      return (
                        <React.Fragment key={path.flightCost}>
                          <Box my={2}>
                            <Typography variant="body1" >
                              {getPathValue('Стоимость полёта', 'flightCost')}
                              <br/>
                              {getPathValue('Высота', 'altitude')}
                              <br/>
                              {getPathValue('Скорость', 'speed')}
                              <br/>
                              {getPathValue('Дистанция', 'distance')}
                              <br/>
                              {getPathValue('Затраты топлива', 'fuel')}
                              <br/>
                              {getPathValue('Затраты времени', 'time', formatTime)}
                              <br/>
                              {getPathValue('Средний ветер', 'averageWind')}
                            </Typography>
                          </Box>
                          <Divider/>
                        </React.Fragment>
                      )
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          ) : (
            <Typography variant="body1">
              Для выбранного времени прибытия маршрута не существует или не введено время прибытия.
            </Typography>
          )}
        </Box>

        { rta !== null && (
          <Box mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={toggleRtaDialog}
            >
              Показать графики
            </Button>
          </Box>
        )}
      </Box>

      <Dialog
        isOpen={fuelDialogOpen}
        onClose={toggleFuelDialog}
        title="Графики маршрута, оптимального по топливу"
      >
        <OptimalPathCharts
          optimalPath={fuel}
          air={props.air}
          initialAltitude={props.initialAltitude}
          startGPSPoint={props.startGPSPoint}
          endGPSPoint={props.endGPSPoint}
          initialPoints={props.initialPoints}
        />
      </Dialog>

      <Dialog
        isOpen={timeDialogOpen}
        onClose={toggleTimeDialog}
        title="Графики маршрута, оптимального по времени"
      >
        <OptimalPathCharts
          optimalPath={time}
          air={props.air}
          initialAltitude={props.initialAltitude}
          startGPSPoint={props.startGPSPoint}
          endGPSPoint={props.endGPSPoint}
          initialPoints={props.initialPoints}
        />
      </Dialog>

      <Dialog
        isOpen={combinedDialogOpen}
        onClose={toggleCombinedDialog}
        title="Графики маршрута, оптимального по смешанному критерию"
      >
        <OptimalPathCharts
          optimalPath={combined}
          air={props.air}
          initialAltitude={props.initialAltitude}
          startGPSPoint={props.startGPSPoint}
          endGPSPoint={props.endGPSPoint}
          initialPoints={props.initialPoints}
        />
      </Dialog>

      { rta !== null && (
        <Dialog
          isOpen={rtaDialogOpen}
          onClose={toggleRtaDialog}
          title="Графики маршрута, оптимального по критерию минимума задержки прибытия"
        >
          <OptimalPathCharts
            optimalPath={rta}
            air={props.air}
            initialAltitude={props.initialAltitude}
            startGPSPoint={props.startGPSPoint}
            endGPSPoint={props.endGPSPoint}
            initialPoints={props.initialPoints}
          />
        </Dialog>
      )}
    </Box>
  )
};

export default OptimalPaths;

function getValueWithLabel(pathInfo: OptimalPath) {
  return function (label: string, fieldName: Exclude<keyof OptimalPath, 'sections' | 'path'>, formatter?: Function) {
    const value = pathInfo[fieldName];
    if (formatter) {
      return `${label}: ${formatter(value)}`;
    }
    const isInteger = Number.isInteger(value);
    return `${label}: ${isInteger ? value : value.toFixed(2)}`
  }
}
