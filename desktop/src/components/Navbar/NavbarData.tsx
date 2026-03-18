import React from 'react';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import * as RiIcons from 'react-icons/ri';

export const SidebarData = [
  {
    title: 'Home',
    path: '/home',
    icon: <AiIcons.AiFillHome />,
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
    title: 'Settings',
    path: '/settings',
    icon: <IoIcons.IoMdSettings />,
    cName: 'nav-text',
    roleRequested: ['ROLE_USER', 'ROLE_ADMIN']
  },
];
