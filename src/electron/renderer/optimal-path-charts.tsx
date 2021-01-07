import React from 'react';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import CoordsChart from './coords-chart';
import AltitudeChart from './altitude-chart';
import AirConditionsTable from './air-conditions-table';

import { AirConditions, OptimalPathWithCoords } from '../../types/interfaces';

type OptimalPathsSet = {
  fuel?: OptimalPathWithCoords,
  time?: OptimalPathWithCoords,
  combined?: OptimalPathWithCoords,
  rta?: OptimalPathWithCoords|null,
};

interface Props {
  optimalPaths: OptimalPathsSet,
  air: Map<number, AirConditions>|null;
  initialAltitude: number;
  startGPSPoint: { lat: number, long: number };
  endGPSPoint: { lat: number, long: number };
  initialPoints: { entry: { x: number, y: number }, exit: { x: number, y: number } };
}

const OptimalPathCharts = (props: Props) => {
  const {
    optimalPaths,
    air,
    initialAltitude,
    startGPSPoint,
    endGPSPoint,
    initialPoints,
  } = props;

  const altitudeDataSets: {[K in keyof OptimalPathsSet]: {
    startAltitude: number,
    endAltitude: number,
    distance: {
      climb: number,
      cruise: number,
      descent: number,
    },
  }} = {};

  const coordsDataSets: {[K in keyof OptimalPathsSet]: {
    coords: { lat: number, long: number }[];
    forbiddenZone?: { lat: number, long: number }[];
  }} = {};

  const pathGridDataSets: {[K in keyof OptimalPathsSet]: {
    path: number[][],
  }} = {};

  const firstPathAltitude = (Object.values(optimalPaths)[0] as OptimalPathWithCoords).altitude;

  (Object.keys(optimalPaths) as (keyof OptimalPathsSet)[]).forEach((pathType: keyof OptimalPathsSet) => {
    const path = optimalPaths[pathType];
    if (!path) return;
    altitudeDataSets[pathType] = {
      startAltitude: initialAltitude,
      endAltitude: path.altitude,
      distance: path.sections,
    };
    coordsDataSets[pathType] = {
      coords: path.coords,
      forbiddenZone: path.zone,
    };
    pathGridDataSets[pathType] = {
      path: path.path,
    };
  });

  return (
    <Box maxWidth={1600} p={5} mx="auto">
      <Box mb={3}>
        <AltitudeChart
          dataSets={altitudeDataSets as Required<typeof altitudeDataSets>}
        />
      </Box>

      <Divider/>

      <Box my={3}>
        <CoordsChart
          dataSets={coordsDataSets as Required<typeof coordsDataSets>}
          startGPSPoint={startGPSPoint}
          endGPSPoint={endGPSPoint}
        />
      </Box>

      <Divider/>

      <Box mt={3}>
        { air !== null && air.has(firstPathAltitude) && (
          <AirConditionsTable
            air={air.get(firstPathAltitude)!}
            dataSets={(pathGridDataSets as Required<typeof pathGridDataSets>)}
            initialPoints={initialPoints}
          />
        )}
      </Box>
    </Box>
  );
};

export default OptimalPathCharts;
