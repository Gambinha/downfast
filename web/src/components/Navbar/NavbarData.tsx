import React from 'react';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import * as RiIcons from 'react-icons/ri';
import * as GiIcons from 'react-icons/gi';
import * as FaIcons from 'react-icons/fa';
import * as BiIcons from 'react-icons/bi';

export const SidebarData = [
  {
    title: 'Home',
    path: '/home',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text',
    roleRequested: ['ROLE_USER', 'ROLE_ADMIN']
  },
  {
    title: 'Studio',
    path: '/studio',
    icon: <BiIcons.BiMovie />,
    cName: 'nav-text',
    roleRequested: ['ROLE_USER', 'ROLE_ADMIN']
  },
  {
    title: 'Library',
    path: '/library',
    icon: <RiIcons.RiPlayListFill />,
    cName: 'nav-text',
    roleRequested: ['ROLE_USER', 'ROLE_ADMIN']
  },
  {
    title: 'Feed',
    path: '/feed',
    icon: <GiIcons.GiShare />,
    cName: 'nav-text',
    roleRequested: ['ROLE_USER', 'ROLE_ADMIN']
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: <IoIcons.IoMdSettings />,
    cName: 'nav-text',
    roleRequested: ['ROLE_USER', 'ROLE_ADMIN']
  },
  {
    title: 'Playlists',
    path: '/playlists',
    icon: <RiIcons.RiListSettingsLine />,
    cName: 'nav-text',
    roleRequested: ['ROLE_ADMIN']
  },
  {
    title: 'Usuários',
    path: '/users',
    icon: <FaIcons.FaUsersCog />,
    cName: 'nav-text',
    roleRequested: ['ROLE_ADMIN']
  }
];