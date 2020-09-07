import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import AirConditionsTable from './air-conditions-table';

import { AirConditions as IAirConditions } from '../../types/interfaces';

interface Props {
  airConditions: Map<number, IAirConditions>;

  disableWind?: boolean;
}

const AirConditions = (props: Props) => {
  const { airConditions, disableWind } = props;

  return (
    <Box bgcolor="#f5f5f5">
      <Box p={3}>
        { Array.from(airConditions).map(([key, value]) => {
          return (
            <Accordion
              TransitionProps={{
                mountOnEnter: true,
                unmountOnExit: true,
              }}
              key={key}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                id={`alt-${key}-header`}
              >
                <Typography variant="body1">
                  Высота
                  {' '}
                  {key}
                  {' '}
                  футов
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <AirConditionsTable air={value} disableWind={disableWind}/>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};

export default AirConditions;
