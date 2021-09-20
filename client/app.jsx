import React from 'react';
import {BrowserRouter as Router, Switch, Route, Redirect} from 'react-router-dom';

import EarthRefRoutes from '/client/modules/er/routes';
import KdDRoutes from '/client/modules/kdd/routes';

const supportsHistory = 'pushState' in window.history;

const App = () => (
  <Router forceRefresh={!supportsHistory}>
    <Switch>
      <Redirect exact from="/" to="/KdD"/>
      <Route path="/KdD" component={KdDRoutes}/>
      <Route               component={EarthRefRoutes}/>
    </Switch>
  </Router>
);

export default App;