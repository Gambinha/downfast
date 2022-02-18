import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router';

import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as BiIcons from 'react-icons/bi';
import { IconContext } from 'react-icons';

import { Link } from 'react-router-dom';
import { SidebarData } from './NavbarData';

import './style.css';

import { UserContext } from '../../contexts/userData';

interface NabvarProps {
  page: number;
  page_title: string;
}

const Navbar: React.FC<NabvarProps> = (props) => {
  const history = useHistory();

  const [sidebar, setSidebar] = useState(false);
  
  const {userData, addUserData} = useContext(UserContext);

  const showSidebar = () => {
    setSidebar(!sidebar);
  }

  function handleLogout(){
    localStorage.removeItem('user');
    localStorage.removeItem('x-access-token');

    addUserData({
      id: '',
      name: '',
      email: '',
      username: '',
      likedsPlaylists: [''],
      role: ''
    })

    history.push('/');
  }

  return (
    <>
      <IconContext.Provider value={{ color: '#fff' }}>
        <div className='navbar'>
          <Link to='#' className='menu-bars'>
            <FaIcons.FaBars onClick={showSidebar} />
          </Link>
          <h2>{props.page_title}</h2>
          <div id="user-informations">
            <div id="user">
              <BiIcons.BiUserCircle size='40' id="user-icon" />
              <div id="name-email">
                <span id="name">{userData.username}</span>
                <span id="email">{userData.email}</span>
              </div>
            </div>
            <button id="logout" title="Logout" onClick={handleLogout}>
              <AiIcons.AiOutlineLogout size='26'/>
            </button>
          </div>
        </div>
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
          <ul className='nav-menu-items' onClick={showSidebar}>
            <li className='navbar-toggle'>
              <Link to='#' className='menu-bars'>
                <AiIcons.AiOutlineClose />
              </Link>
            </li>
            {SidebarData.map((item, index) => {
              return (
                <div key={index}>
                {item.roleRequested.indexOf(userData.role) !== -1 ?
                    <li key={index} className={item.cName}>
                      <Link to={item.path} className={props.page === (index+1) ? 'active' : ''}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  :
                    null
                }
                </div>
              );
            })}
          </ul>
        </nav>
      </IconContext.Provider>
    </>
  );
} 

export default Navbar;