import React from 'react';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import CoordsChart from './coords-chart';
import AltitudeChart from './altitude-chart';
import AirConditionsTable from './air-conditions-table';

import { AirConditions, OptimalPathWithCoords } from '../../types/interfaces';

interface Props {
  optimalPath: OptimalPathWithCoords;
  air: Map<number, AirConditions>|null;
}

const OptimalPathCharts = (props: Props) => {
  const { optimalPath, air } = props;

  return (
    <Box maxWidth={1600} p={5} mx="auto">
      <Box mb={3}>
        <AltitudeChart
          startAltitude={30000}
          endAltitude={optimalPath.altitude}
          distance={optimalPath.sections}
        />
      </Box>

      <Divider/>

      <Box my={3}>
        <CoordsChart coords={optimalPath.coords}/>
      </Box>

      <Divider/>

      <Box mt={3}>
        { air !== null && air.has(optimalPath.altitude) && (
          <AirConditionsTable
            air={air.get(optimalPath.altitude)!}
            path={optimalPath.path}
          />
        )}
      </Box>
    </Box>
  );
};

export default OptimalPathCharts;
