import React from 'react';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import InitialConditions from './initial-conditions';
import AirConditionsLoader from './air-conditions-loader';
import PathfinderController from './pathfinder-controller';
import OptimalPaths from './optimal-paths';
import AsideStepper from './aside-stepper';
import ContentSection from './content-section';

import { AirConditions } from '../../types/interfaces';

type AppState = {
  initialDataLoaded: boolean,
  airConditionsLoaded: boolean,
  routesCalculated: boolean,
  airConditions: Map<number, AirConditions>|null,
};

class Main extends React.Component<{}, AppState> {
  state = {
    initialDataLoaded: false,
    airConditionsLoaded: false,
    routesCalculated: false,
    airConditions: null,
  };

  onInitialDataLoad = () => {
    this.setState({
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
                />
              </ContentSection>
            </Box>

            <Box mt={5}>
              <ContentSection
                title="Оптимальные маршруты"
                blocked={!routesCalculated}
              >
                <OptimalPaths/>
              </ContentSection>
            </Box>
          </Box>

          <Box mr={3} ml={6}>
            <Divider orientation="vertical"/>
          </Box>

          <Box component="aside">
            <AsideStepper/>
          </Box>
        </Box>
      </Container>
    )
  }
}

export default Main;
