import React from 'react';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import InitialConditions from './initial-conditions';
import AirConditionsLoader from './air-conditions-loader';
import PathfinderController from './pathfinder-controller';
import OptimalPaths from './optimal-paths';
import ContentSection from './content-section';

import { AirConditions } from '../../types/interfaces';

type AppState = {
  initialDataLoaded: boolean,
  airConditionsLoaded: boolean,
  routesCalculated: boolean,
  airConditions: Map<number, AirConditions>|null,
  initialAltitude: number,
  startGPSPoint: { lat: number, long: number },
  endGPSPoint: { lat: number, long: number },
  entryPoint: { x: number, y: number },
  exitPoint: { x: number, y: number },
};

class Main extends React.Component<{}, AppState> {
  state: AppState = {
    initialDataLoaded: false,
    airConditionsLoaded: false,
    routesCalculated: false,
    airConditions: null,
    initialAltitude: 0,
    startGPSPoint: { lat: 0, long: 0 },
    endGPSPoint: { lat: 0, long: 0 },
    entryPoint: { x: 0, y: 0 },
    exitPoint: { x: 0, y: 0 },
  };

  componentDidMount() {
    if (!window.electron) return;

    window.electron.listenToInitialPoints((initialPoints: Record<string, { x: number, y: number }>) => {
      this.setState({
        entryPoint: initialPoints.entry,
        exitPoint: initialPoints.exit,
      });
    });
  }

  onInitialDataLoad = (
    altitude: number,
    startGPSPoint: { lat: number, long: number },
    endGPSPoint: { lat: number, long: number },
  ) => {
    this.setState({
      initialAltitude: altitude,
      startGPSPoint,
      endGPSPoint,
      initialDataLoaded: true,
    });
  };

  onAirConditionsLoad = (airConditions: Map<number, AirConditions>) => {
    this.setState({
      airConditionsLoaded: true,
      airConditions,
    });
  }

  onRoutesCalculated = () => {
    this.setState({
      routesCalculated: true,
    });
  }

  render() {
    const {
      initialDataLoaded,
      airConditionsLoaded,
      routesCalculated,
    } = this.state;

    return (
      <Container className="page" maxWidth="lg">
        <Typography variant="h2" component="h1" gutterBottom>
          Disser App
        </Typography>

        <Box display="flex">
          <Box component="main">
            <Box>
              <ContentSection
                title="Начальные условия"
              >
                <InitialConditions
                  onSubmit={this.onInitialDataLoad}
                />
              </ContentSection>
            </Box>

            <Box mt={5}>
              <ContentSection
                title="Параметры воздушного пространства"
                blocked={!initialDataLoaded}
              >
                <AirConditionsLoader
                  blocked={!initialDataLoaded}
                  onFileLoaded={this.onAirConditionsLoad}
                />
              </ContentSection>
            </Box>

            <Box mt={5}>
              <ContentSection
                title="Расчёт множества траекторий"
                blocked={!initialDataLoaded || !airConditionsLoaded}
              >
                <PathfinderController
                  blocked={!initialDataLoaded || !airConditionsLoaded}
                  onRoutesCalculated={this.onRoutesCalculated}
                  air={this.state.airConditions}
                  initialPoints={{ entry: this.state.entryPoint, exit: this.state.exitPoint }}
                />
              </ContentSection>
            </Box>

            <Box mt={5}>
              <ContentSection
                title="Оптимальные маршруты"
                blocked={!routesCalculated}
              >
                <OptimalPaths
                  air={this.state.airConditions}
                  initialAltitude={this.state.initialAltitude}
                  startGPSPoint={this.state.startGPSPoint}
                  endGPSPoint={this.state.endGPSPoint}
                  initialPoints={{ entry: this.state.entryPoint, exit: this.state.exitPoint }}
                />
              </ContentSection>
            </Box>
          </Box>
        </Box>
      </Container>
    )
  }
}

export default Main;
