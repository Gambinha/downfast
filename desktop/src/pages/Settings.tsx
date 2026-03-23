import React, { useContext, useEffect, useState } from 'react';

import '../styles/pages/settings.css';

import Navbar from '../components/Navbar';
import { UserContext } from '../contexts/userData';

import { AxiosError } from 'axios';

import * as AiIcons from 'react-icons/ai';
import ConfirmationWindow from '../components/ConfirmationWindow';

import { updateApiBaseUrl, getServerUrl } from '../services/api';

import { updateUser, changePassword, deleteUser } from '../services/userService';
import type { ChangePasswordErrorResponse } from '../types/api';


function Settings() {
    const {userData, addUserData} = useContext(UserContext);

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

    // Server URL configuration
    const [serverUrl, setServerUrl] = useState('http://localhost:3333');
    const [serverUrlWarning, setServerUrlWarning] = useState('');
    const [showServerUrlWarning, setShowServerUrlWarning] = useState(false);

    useEffect(() => {
        getServerUrl().then((url) => {
            setServerUrl(url);
        });
    }, []);

    useEffect(() => {
        if(editOperation === true) {
            setEditOperation(false);

            if(confirmationWindow === 'true') {
                const updatedUserData = {
                    id: userData.id,
                    name: editedName,
                    username: editedUsername,
                    email: editedEmail,
                    likedsPlaylists: userData.likedsPlaylists,
                    role: userData.role
                };

                updateUser({ updatedUser: updatedUserData })
                    .then(() => {
                        changeScreen();
                        addUserData(updatedUserData);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        }

        if(removeOperation === true) {
            setRemoveOperation(false);

            if(confirmationWindow === 'true') {
                deleteUser(userData.id)
                    .then(() => {
                        // Interceptor will handle the logout redirect
                        localStorage.removeItem('user');
                        localStorage.removeItem('x-access-token');
                        alert('Failed to authenticate token!');
                        window.location.href = '/';
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        }

        if(editPasswordOperation === true) {
            setEditPasswordOperation(false);

            if(confirmationWindow === 'true') {
                changePassword(userData.id, {
                    actualPassword: actualPassword,
                    newPassword: newPassword1
                })
                    .then(() => {
                        alert('Senha Alterada com Sucesso!');
                        setShowPasswordWarning(false);
                        closePasswordPopup();
                    })
                    .catch((error) => {
                        const axiosError = error as AxiosError<ChangePasswordErrorResponse>;
                        if(axiosError.response) {
                            if(axiosError.response.data.error === 'Incorrect User or Password!') {
                                setShowPasswordWarning(true);
                                setPasswordWarning('*Senha não está correta!');
                            }
                        } else {
                            console.error(error);
                        }
                    });
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

    async function handleSaveServerUrl() {
        if (!serverUrl.trim()) {
            setShowServerUrlWarning(true);
            setServerUrlWarning('*URL não pode estar vazia!');
            return;
        }
        try {
            await updateApiBaseUrl(serverUrl.trim());
            setShowServerUrlWarning(true);
            setServerUrlWarning('URL salva com sucesso!');
        } catch {
            setShowServerUrlWarning(true);
            setServerUrlWarning('*Erro ao salvar URL!');
        }
    }

    return(
        <div id="home-landing">
            <Navbar page={3} page_title={'Settings'}/>

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

                {/* Server URL Configuration */}
                <div id="profile-container" style={{marginTop: '30px'}}>
                    <div id="title-container">
                        <h2>Configurações do Servidor</h2>
                    </div>
                    <div className="profile-item">
                        <label htmlFor="server-url">URL do Servidor:</label>
                        <input
                            type="text"
                            id="server-url"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            placeholder="http://localhost:3333"
                        />
                    </div>
                    <div id="profile-buttons">
                        <button
                            id="edit-profile"
                            onClick={handleSaveServerUrl}
                        >
                            Salvar URL
                        </button>
                    </div>
                    { showServerUrlWarning &&
                        <span style={{
                            fontSize: '1.3rem',
                            color: serverUrlWarning.includes('sucesso') ? 'green' : 'red',
                            marginTop: '10px'
                        }}>
                            {serverUrlWarning}
                        </span>
                    }
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
    );
}

export default Settings;
