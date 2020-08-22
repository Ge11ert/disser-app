import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Main from './main';
import AirConditions from './air-conditions';

const App = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/air" component={AirConditions}/>
      <Route exact path="/" component={Main}/>
    </Switch>
  </BrowserRouter>
);

const root = document.getElementById('react-root');
ReactDOM.render(<App/>, root);
