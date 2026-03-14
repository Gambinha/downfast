import { AxiosError } from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { UserContext } from '../contexts/userData';
import Functions from '../functions/Functions';
import api from '../services/api';

import * as FaIcons from 'react-icons/fa';
import * as BsIcons from 'react-icons/bs';

import '../styles/pages/usuarios.css';
import ConfirmationWindow from '../components/ConfirmationWindow';


interface UsersProps {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
}

function Usuarios() {
    const functions = new Functions();
    const history = useHistory();

    const {userData, addUserData} = useContext(UserContext);

    const [users, setUsers] = useState<UsersProps[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UsersProps[]>([]);

    const [userName, setUserName] = useState<string>('');

    //Confirmation Window
    const [showConfirmationWindow, setShowConfirmationWindow] = useState(false);
    const [confirmationWindow, setConfirmationWindow] = useState('');

    const [removeOperation, setRemoveOperation] = useState(false);

    const [removedId, setRemovedId] = useState<string>('');
    const [removedIndex, setRemovedIndex] = useState<number>(0);

    function handleLogout(message: string){
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
    
        alert(message);
        history.push('/');
    }
    
    useEffect(() => {
        if (userName != null) {
            let users_array = [...users];
            let filtered = users_array.filter((user) => {
              return user.name.toLowerCase().indexOf(userName.toLowerCase()) !== -1;
            });
      
            setFilteredUsers(filtered);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userName]);

    useEffect(() => {
        const token = functions.getToken();

        if(token) {
            if(removeOperation === true) {
                setRemoveOperation(false);

                if(confirmationWindow === 'true') {   
                    api.delete(`/users/${removedId}`, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then(response => {
                        const currentUsers = [...users];
    
                        currentUsers.splice(removedIndex, 1);
    
                        setUsers(currentUsers);
                        setFilteredUsers(currentUsers);
                    }).catch((error: AxiosError) => {
                        if(error.response) {
                            const isTokenValid = error.response.data.auth;
                            const errorMessage = error.response.data.message;
            
                            if(isTokenValid === false) {
                                handleLogout(errorMessage);
                            }
                        }
                        else {
                            console.error(error); 
                        }
                    })
                }
                else {
                    // console.log('Não excluiir');
                }
            }
        }
        setConfirmationWindow('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmationWindow]);

    useEffect(() => {
        const token = functions.getToken();

        api.get('/users', {
            headers: {
                "Authorization": `${token}`
            }
        }).then(response => {
            const users: UsersProps[] = response.data;

            setUsers(users);
            setFilteredUsers(users);
        }).catch((error: AxiosError) => {
            if(error.response) {
                const isTokenValid = error.response.data.auth;
                const errorMessage = error.response.data.message;

                if(isTokenValid === false) {
                    handleLogout(errorMessage);
                }
            }
            else {
                console.error(error);
            }
        })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function updateRole(role: string, user_id: string, index: number) {
        let newRole: string = '';

        if(role === 'ROLE_USER') newRole = 'ROLE_ADMIN';
        else if(role === 'ROLE_ADMIN') newRole = 'ROLE_USER';

        const token = functions.getToken();

        if(token) {
            api.put('/users/role', {
                user_id,
                newRole
            }, {
                headers: {
                    "Authorization": `${token}`
                }
            }).then(response => {
                const currentUsers = [...users];

                currentUsers[index].role = newRole;

                setUsers(currentUsers);
                setFilteredUsers(currentUsers);
            }).catch((error: AxiosError) => {
                if(error.response) {
                    const isTokenValid = error.response.data.auth;
                    const errorMessage = error.response.data.message;
    
                    if(isTokenValid === false) {
                        handleLogout(errorMessage);
                    }
                }
                else {
                    console.error(error);
                }
            })
        }
        else {
            handleLogout('Failed to authenticate token.');
        }
    }

    return(
        <div id="usuarios-landing">
            <Navbar page={7} page_title={'Usuarios'}/>

            <div className="usuarios-container">
            <div id="search-bar">
                    <h2>Lista de Usuários</h2>

                    <div id="search-bar-inputs">
                        <input type="text" name="" id="user-name" placeholder="Pesquisar Usuários" onChange={(e) => setUserName(e.target.value)} />
                    </div>

                    <div id="users-container">
                        { filteredUsers.map((user, index) => {
                            return(
                                <div key={index} >
                                { user.id !== userData.id ? 
                                    <div className="user">
                                        <div className="user-infos">
                                            <FaIcons.FaUserCircle size={44} />
                                            <div className="user-infos-names">
                                                <h3 title={`${user.name} (${user.username})`} >{user.name} ({user.username})</h3>
                                                <span title={user.email} >{user.email}</span>
                                            </div>
                                        </div>

                                        <div className="user-actions">
                                            <div className="user-role">
                                                <span>{user.role}</span>
                                                <button 
                                                    className={ user.role === 'ROLE_ADMIN' ?
                                                        'change-role-red'
                                                    :
                                                        'change-role-green'
                                                    }
                                                    style={ user.role === 'ROLE_ADMIN' ? 
                                                        {border: '1px solid red', color: 'red'} 
                                                        : 
                                                        {border: '1px solid green', color: 'green'}
                                                    } 
                                                    onClick={() => updateRole(user.role, user.id, index)}
                                                >
                                                    { user.role === 'ROLE_ADMIN' ?
                                                        'Remover ADMIN'
                                                    :
                                                        'Tornar ADMIN'
                                                    }
                                                </button>
                                            </div>

                                            <button className="remove-user" 
                                                onClick={() => {
                                                    setRemovedId(user.id);
                                                    setRemovedIndex(index);
                                                    setRemoveOperation(true);
                                                    setShowConfirmationWindow(true);
                                                }} 
                                            >
                                            {/* <button className="remove-user" onClick={() => {setShowConfirmationWindow(true);}} > */}
                                                <BsIcons.BsFillTrashFill color='#7a0b0b' size={24} />
                                            </button>  
                                        </div>
                                    </div>
                                    :
                                        <></>
                                }
                                </div>
                            );
                        })}
                    </div>

                    { showConfirmationWindow && 
                        <ConfirmationWindow 
                            setConfirmation={setConfirmationWindow} 
                            setShowConfirmationWindow={setShowConfirmationWindow} 
                        >
                        </ConfirmationWindow>
                    }

                </div>
            </div>
        </div>
    )
}

export default Usuarios;