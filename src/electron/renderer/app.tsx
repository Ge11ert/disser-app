import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch } from 'react-router-dom';
import Main from './main';

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path="/" component={Main}/>
    </Switch>
  </HashRouter>
);

const root = document.getElementById('react-root');
ReactDOM.render(<App/>, root);
