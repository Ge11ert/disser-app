import React from 'react';
import ReactDOM from 'react-dom';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';

import InitialConditions from './initial-conditions';
import FileSelector from './file-selector';
import PathfinderController from './pathfinder-controller';
import AsideStepper from './aside-stepper';
import ContentSection from './content-section';

type AppState = {
  initialDataLoaded: boolean,
  airConditionsLoaded: boolean,
  routesCalculated: boolean,
};

class App extends React.Component<{}, AppState> {
  state = {
    initialDataLoaded: false,
    airConditionsLoaded: false,
    routesCalculated: false,
  };

  componentDidMount() {
    // @ts-ignore
    if (TARGET === 'web') return; // defined by webpack
    window.electron.listenToMainAppData();
  }

  onInitialDataLoad = () => {
    this.setState({
      initialDataLoaded: true,
    });
  };

  onAirConditionsLoad = () => {
    this.setState({
      airConditionsLoaded: true,
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
                <FileSelector
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
                />
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

const root = document.getElementById('react-root');
ReactDOM.render(<App/>, root);
