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

class App extends React.Component {
  componentDidMount() {
    // @ts-ignore
    if (TARGET === 'web') return; // defined by webpack
    window.electron.listenToMainAppData();
  }

  render() {
    return (
      <Container className="page" maxWidth="lg">
        <Typography variant="h2" component="h1" gutterBottom>
          Disser App
        </Typography>

        <Box display="flex">
          <Box component="main">
            <InitialConditions/>
            <FileSelector/>
            <PathfinderController/>
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
