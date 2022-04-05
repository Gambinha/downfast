import React from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

// import Home from './pages/Home';
import Home2 from './pages/Home2';
import Studio from './pages/Studio';
import Library from './pages/Library';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import Cadastro from './pages/Cadastro';
import Playlists from './pages/Playlists';
import Usuarios from './pages/Usuarios';

import { UserProvider } from './contexts/userData';

function Routes() {
    return (
        <BrowserRouter>
            <Switch>
                <UserProvider>
                    <Route path='/' exact component={Cadastro} />
                    <Route path='/home' component={Home2} />
                    <Route path='/studio' component={Studio} />
                    <Route path='/library' component={Library} />
                    <Route path='/feed' component={Feed} />
                    <Route path='/settings' component={Settings} />
                    <Route path='/playlists' component={Playlists} />
                    <Route path='/users' component={Usuarios} />
                </UserProvider>
            </Switch>
        </BrowserRouter>
    );
}

export default Routes;