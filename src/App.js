import React, { Component } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import {Route, Switch} from "react-router-dom";

class App extends Component {
    render() {
        return (
            <Switch>
                <Route exact path="/" component={Login} />
                <Route path="/home" component={Home} />
          </Switch>
        );
    }
}

export default App;
