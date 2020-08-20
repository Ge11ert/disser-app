import React from 'react';
import ReactDOM from 'react-dom';

import InitialConditions from './initial-conditions';
import FileSelector from './file-selector';
import PathfinderController from './pathfinder-controller';

class App extends React.Component {
  componentDidMount() {
    window.electron.listenToAirConditionsLoaded();
    window.electron.listenToMainAppData();
  }

  render() {
    return (
      <div className="page">
        <InitialConditions/>
        <FileSelector/>
        <PathfinderController/>
      </div>
    )
  }
}

const root = document.getElementById('react-root');
ReactDOM.render(<App/>, root);
