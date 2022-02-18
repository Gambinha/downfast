import React, { useContext, useEffect, useState } from 'react';

import '../styles/pages/settings.css';

import Navbar from '../components/Navbar';
import { UserContext } from '../contexts/userData';

import {AxiosError} from 'axios';

import * as AiIcons from 'react-icons/ai';
import ConfirmationWindow from '../components/ConfirmationWindow';

import Functions from '../functions/Functions';
import api from '../services/api';
import { useHistory } from 'react-router';

const functions = new Functions();


function Settings() {
    const {userData, addUserData} = useContext(UserContext);
    const history = useHistory();

    const [showEdit, setShowEdit] = useState<boolean>(false);
    const [wasUpdated, setWasUpdated] = useState<boolean>(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState<boolean>(false);

    const [editedName, setEditedName] = useState<string>('');
    const [editedUsername, setEditedUsername] = useState<string>('');
    const [editedEmail, setEditedEmail] = useState<string>('');

    const [showConfirmationWindow, setShowConfirmationWindow] = useState(false);
    const [confirmationWindow, setConfirmationWindow] = useState('');

    const [editOperation, setEditOperation] = useState(false);
    const [removeOperation, setRemoveOperation] = useState(false);
    const [editPasswordOperation, setEditPasswordOperation] = useState(false);

    const [password1, setPassword1] = useState<boolean>(false);
    const [password2, setPassword2] = useState<boolean>(false);
    const [password3, setPassword3] = useState<boolean>(false);

    const [actualPassword, setActualPassword] = useState('');
    const [newPassword1, setNewPassword1] = useState('');
    const [newPassword2, setNewPassword2] = useState('');

    const [passwordWarning, setPasswordWarning] = useState('Teste');
    const [showPasswordWarning, setShowPasswordWarning] = useState(false);

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
        const token = functions.getToken();

        if(token) {
            if(editOperation === true) {
                setEditOperation(false);

                if(confirmationWindow === 'true') {
                    const updatedUser = {
                        id: userData.id,
                        name: editedName,
                        username: editedUsername,
                        email: editedEmail,
                        likedsPlaylists: userData.likedsPlaylists,
                        role: userData.role
                    }

                    api.put("/users", {
                        updatedUser
                    }, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then(response => {
                        // console.log(response);
                        changeScreen();
                        addUserData(updatedUser);
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
                    // console.log('Não Editar');
                }
            }   

            if(removeOperation === true) {
                setRemoveOperation(false);

                if(confirmationWindow === 'true') {
                    
                    api.delete(`/users/${userData.id}`, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    })
                        .then(response => {
                            handleLogout('Failed to authenticate token!');
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
                    // console.log('Não Excluir');
                }
            }   

            if(editPasswordOperation === true) {
                setEditPasswordOperation(false);

                if(confirmationWindow === 'true') {
                    api.put(`/users/password/${userData.id}`, {
                        actualPassword: actualPassword,
                        newPassword: newPassword1
                    }, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then(response => {
                        alert('Senha Alterada com Sucesso!');
                        setShowPasswordWarning(false);
                        closePasswordPopup();
                    }).catch((error: AxiosError) => {
                        if(error.response) {
                            if(error.response.data.auth) {
                                const isTokenValid = error.response.data.auth;
                                const errorMessage = error.response.data.message;
        
                                if(isTokenValid === false) {
                                    handleLogout(errorMessage);
                                }
                            }
                            else if(error.response.data.error === 'Incorrect User or Password!') {
                                setShowPasswordWarning(true);
                                setPasswordWarning('*Senha não está correta!');
                            }
                        }
                        else {
                            console.error(error);
                        }
                    })
                }
                else {
                    // console.log('Não Editar Senha');
                }
            }   
        }

        setConfirmationWindow('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmationWindow]);

    function changeScreen() {
        setShowEdit(!showEdit);
    }

    function editProfile() {
        if(wasUpdated === true) {
            setEditOperation(true);
            setShowConfirmationWindow(true);
        }
        else {
            alert('Não há alterações!');
        }
    }

    function editPassword() {
        if(actualPassword && newPassword1 && newPassword2) {
            if(newPassword1.length >=8) {
                if(newPassword1 === newPassword2) {
                    setEditPasswordOperation(true);
                    setShowConfirmationWindow(true);
                }
                else {
                    setShowPasswordWarning(true);
                    setPasswordWarning('*Senhas incompatíveis!');
                }
            }
            else {
                setShowPasswordWarning(true);
                setPasswordWarning('*Senha deve ter no mínimo 8 caracteres!');
            }
        }
        else {
            setShowPasswordWarning(true);
            setPasswordWarning('*Campo não inserido!');
        }
    }

    function removeAccount() {
        setRemoveOperation(true);
        setShowConfirmationWindow(true);
    }

    function editScreen() {
        setEditedName(userData.name);
        setEditedUsername(userData.username);
        setEditedEmail(userData.email);

        changeScreen();
    }

    function openPasswordPopup() {
        setShowPasswordPopup(true);
    }

    function closePasswordPopup() {
        setShowPasswordPopup(false);
    }

    return(
        <div id="home-landing">
            <Navbar page={4} page_title={'Settings'}/>

            <div className='settings-container'>
                <div id="title-container">
                    <h2>Meu Perfil</h2>
                </div>

                { showEdit ?
                    <div id="edit-container">
                        <div className="profile-item">
                            <label htmlFor="">Nome:</label>
                            <input type="text" maxLength={40} name="" id="" defaultValue={userData.name} onChange={(e) => {setEditedName(e.target.value); setWasUpdated(true)}} />
                            <AiIcons.AiFillEdit />
                        </div>

                        <div className="profile-item">
                            <label htmlFor="">Username:</label>
                            <input type="text" name="" id="" maxLength={24} defaultValue={userData.username} onChange={(e) => {setEditedUsername(e.target.value); setWasUpdated(true)}} />
                            <AiIcons.AiFillEdit />
                        </div>

                        <div className="profile-item">
                            <label htmlFor="">E-mail:</label>
                            <input type="text" maxLength={40} name="" id="" defaultValue={userData.email} onChange={(e) => {setEditedEmail(e.target.value); setWasUpdated(true)}} />
                            <AiIcons.AiFillEdit />
                        </div>

                        <div id="profile-edit-buttons">
                            <button id="cancel-password" onClick={changeScreen} >
                                Cancelar
                            </button>

                            <button id="save-profile" onClick={editProfile} >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                : 
                    <div id="profile-container">
                        <div className="profile-item">
                            <label htmlFor="">Nome:</label>
                            <p>{userData.name}</p>
                        </div>

                        <div className="profile-item">
                            <label htmlFor="">Username:</label>
                            <p>{userData.username}</p>
                        </div>

                        <div className="profile-item">
                            <label htmlFor="">E-mail:</label>
                            <p>{userData.email}</p>
                        </div>

                        <div id="profile-buttons">
                            <button id="edit-password" onClick={openPasswordPopup} >
                                Alterar Senha
                            </button>

                            <button id="edit-profile" onClick={editScreen} >
                                Editar Perfil
                            </button>

                            <button id="remove-account" onClick={removeAccount} >
                                Excluir Conta
                            </button>
                        </div>

                        { showPasswordPopup &&                       
                        <div id="edit-password-popup">
                            <div id="overlay" onClick={closePasswordPopup} ></div>
                            <div id="edit-password-container">
                                <h2>Alterar Senha</h2>

                                <div id="edit-password-form">
                                    <div className="edit-password-item">
                                        <label htmlFor="">Sua Senha:</label>
                                        <input 
                                            type={password1 ? 'text' : 'password'} 
                                            name="" 
                                            onChange={(e) => setActualPassword(e.target.value)}
                                        />
                                        <span onClick={() => setPassword1(!password1)}>
                                            {password1 ? <AiIcons.AiFillEyeInvisible /> : <AiIcons.AiFillEye />}
                                        </span>
                                    </div>

                                    <div className="edit-password-item">
                                        <label htmlFor="">Nova Senha:</label>
                                        <input 
                                            type={password2 ? 'text' : 'password'} 
                                            name="" 
                                            onChange={(e) => setNewPassword1(e.target.value)}
                                        />
                                        <span onClick={() => setPassword2(!password2)}>
                                            {password2 ? <AiIcons.AiFillEyeInvisible /> : <AiIcons.AiFillEye />}
                                        </span>
                                    </div>

                                    <div className="edit-password-item">
                                        <label htmlFor="">Repetir Nova Senha:</label>
                                        <input 
                                            type={password3 ? 'text' : 'password'} 
                                            name="" 
                                            onChange={(e) => setNewPassword2(e.target.value)}
                                        />
                                        <span onClick={() => setPassword3(!password3)} >
                                            {password3 ? <AiIcons.AiFillEyeInvisible /> : <AiIcons.AiFillEye />}
                                        </span>
                                    </div>

                                    <span 
                                        style={ showPasswordWarning ? {visibility: 'visible'} : {visibility: 'hidden'} } 
                                         id="warning-change-password" >
                                        {passwordWarning}
                                    </span>
                                </div>

                                <div id="edit-password-buttons-container">
                                    <button id="cancel-operation" onClick={closePasswordPopup} >Cancelar</button>
                                    <button id="confirm-operation" onClick={editPassword} >Confirmar</button>
                                </div> 
                            </div>
                        </div>
                        }
                    </div>
                }

                { showConfirmationWindow && 
                    <ConfirmationWindow 
                        setConfirmation={setConfirmationWindow} 
                        setShowConfirmationWindow={setShowConfirmationWindow} 
                    >
                    </ConfirmationWindow>
                }
            </div>
        </div>
    );
}

export default Settings;