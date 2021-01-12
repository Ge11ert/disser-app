import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import Flight from '@material-ui/icons/Flight';
import FlightLand from '@material-ui/icons/FlightLand';
import Divider from '@material-ui/core/Divider';
import AirConditionsTable from './air-conditions-table';
import { formatTime } from './utils';

import { TotalRun, AltitudeRun, AirConditions } from '../../types/interfaces';

interface Props {
  totalRun: TotalRun;
  air: Map<number, AirConditions>|null,
  initialPoints?: { entry: { x: number, y: number }, exit: { x: number, y: number }}
}

const CalculatedRoutes = (props: Props) => {
  const { totalRun, air, initialPoints } = props;

  return (
    <Box bgcolor="#f5f5f5">
      <Box p={3}>
        { Array.from(totalRun).map(([speed, altitudes]) => {
          return (
            <Accordion
              TransitionProps={{
                mountOnEnter: true,
                unmountOnExit: true,
              }}
              key={speed}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                id={`speed-${speed}-header`}
              >
                <Typography variant="body1">
                  Скорость
                  {' '}
                  {speed}
                  {' '}
                  M
                </Typography>
              </AccordionSummary>
              <AccordionDetails style={{ display: 'block' }}>
                { Array.from(altitudes).map(([alt, route]) => {
                  return (
                    <Accordion
                      TransitionProps={{
                        mountOnEnter: true,
                        unmountOnExit: true,
                      }}
                      key={alt}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        id={`alt-${alt}-header`}
                      >
                        <Typography variant="body1">
                          Высота
                          {' '}
                          {alt}
                          {' '}
                          футов
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <List>
                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                <FlightTakeoff />
                              </ListItemIcon>
                              <ListItemText disableTypography>
                                <Typography variant="subtitle2">
                                  Набор
                                </Typography>
                                { getDetails(route, 'ascent')}
                              </ListItemText>
                            </ListItem>

                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                <Flight />
                              </ListItemIcon>
                              <ListItemText disableTypography>
                                <Typography variant="subtitle2">
                                  Крейсер
                                </Typography>
                                { getDetails(route, 'cruise')}
                              </ListItemText>
                            </ListItem>

                            <ListItem alignItems="flex-start">
                              <ListItemIcon>
                                <FlightLand />
                              </ListItemIcon>
                              <ListItemText disableTypography>
                                <Typography variant="subtitle2">
                                  Снижение
                                </Typography>
                                { getDetails(route, 'descent')}
                              </ListItemText>
                            </ListItem>
                          </List>

                          { air !== null && air.has(alt) && (
                            <Box mt={4}>
                              <AirConditionsTable
                                air={air.get(alt)!}
                                dataSets={{ cruise: { path: route.cruise.path } }}
                                initialPoints={initialPoints}
                              />
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
    </Box>
  )
};

export default CalculatedRoutes;

function getDetails(route: AltitudeRun, type: 'ascent'|'cruise'|'descent') {
  return (
    <Box display="flex" mt={1}>
      <Typography variant="body1">
        Дистанция:
        {' '}
        {route[type].distanceInMiles.toFixed(5)}
        {' '}
        миль
      </Typography>
      <Divider orientation="vertical" flexItem style={{ margin: '0 8px' }}/>
      <Typography variant="body1">
        Затраты топлива:
        {' '}
        {route[type].fuelBurnInKgs.toFixed(5)}
        {' '}
        килограммов
      </Typography>
      <Divider orientation="vertical" flexItem style={{ margin: '0 8px' }}/>
      <Typography variant="body1">
        Затраты времени:
        {' '}
        {formatTime(route[type].timeInHours)}
      </Typography>
    </Box>
  )
}
