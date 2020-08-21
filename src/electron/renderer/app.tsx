import React from 'react';
import ReactDOM from 'react-dom';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import InitialConditions from './initial-conditions';
import FileSelector from './file-selector';
import PathfinderController from './pathfinder-controller';

class App extends React.Component {
  componentDidMount() {
    // @ts-ignore
    if (TARGET === 'web') return; // defined by webpack
    window.electron.listenToAirConditionsLoaded();
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
        </Box>
      </Container>
    )
  }
}

const root = document.getElementById('react-root');
ReactDOM.render(<App/>, root);
