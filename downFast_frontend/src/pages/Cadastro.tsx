import React, { FormEvent, useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import '../styles/pages/cadastro.css';

import Input from '../components/Input';
import api from "../services/api";

import Functions from '../functions/Functions';
import { UserContext } from "../contexts/userData";
import { AxiosError } from "axios";

import logo from '../images/Logo.png';

interface PlaylistVideosProps {
    name: string;
    url: string;
}

interface PlaylistProps {
    id: string;
    title: string;
    genre: string;
    likes: number;
    security: string;
    keywords: Array<string>;
    videos: Array<PlaylistVideosProps>;
}

const Cadastro = () => {
    const {addUserData, addPlaylistData} = useContext(UserContext);

    const form_cadastro = React.createRef<HTMLDivElement>();
    const form_login = React.createRef<HTMLDivElement>();

    const [cadastroWarning, setCadastroWarning] = useState('Teste');
    const [showCadastroWarning, setShowCadastroWarning] = useState(false);
    const [loginWarning, setLoginWarning] = useState('Teste');
    const [showLoginWarning, setShowLoginWarning] = useState(false);
    const [passwordWarning, setPasswordWarning] = useState('Teste');
    const [showPasswordWarning, setShowPasswordWarning] = useState(false);

    const history = useHistory();

    const [name, setName] = useState('');
    const [emailCadastro, setEmailCadastro] = useState('');
    const [username, setUsername] = useState('');
    const [senhaCadastro1, setSenhaCadastro1] = useState('');
    const [senhaCadastro2, setSenhaCadastro2] = useState('');
    const [terms, setTerms] = useState(false);

    const [emailLogin, setEmailLogin] = useState('');
    const [senhaLogin, setSenhaLogin] = useState('');

    const [loading, setLoading] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [showTermsPopup, setShowTermsPopop] = useState(false);

    const [recoverEmail, setRecoverEmail] = useState('');

    const functions = new Functions();

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

    function changeScreen() {
        if(form_cadastro.current && form_login.current) {
            form_cadastro.current.classList.toggle('hide-screen');
            form_login.current.classList.toggle('hide-screen');
        }

        setShowCadastroWarning(false);
        setShowLoginWarning(false);

        return;
    }

    function handleCreateUser(e: FormEvent) {
        e.preventDefault();
        setLoading(true);

        if(!name || !emailCadastro || !username || !senhaCadastro1 || !senhaCadastro2) {
            setShowCadastroWarning(true);
            setCadastroWarning('*Campo não inserido!');

            setLoading(false);
            return;
        }

        if(senhaCadastro1 !== senhaCadastro2) {
            setShowCadastroWarning(true);
            setCadastroWarning('*Senhas incompatíveis!');

            setLoading(false);
            return;
        }

        if(senhaCadastro1.length < 8) {
            setShowCadastroWarning(true);
            setCadastroWarning('*Senha deve ter no mínimo 8 caracteres!');

            setLoading(false);
            return;
        }

        if(terms === false) {
            setShowCadastroWarning(true);
            setCadastroWarning('*Você deve aceitar os Termos de Serviços!');

            setLoading(false);
            return;
        }

        api.post('/users', {
            name,
            email: emailCadastro,
            username,
            password: senhaCadastro1,
            role: "ROLE_USER"
        }).then(() => {
            setLoading(false);
            changeScreen();
            alert('Relizado com sucesso');

            setShowCadastroWarning(false);

            return;
        }).catch((error: AxiosError) => {
            setLoading(false);
            if(error.response) {
                if(error.response.data.error === 'User already exists') {
                    setShowCadastroWarning(true);
                    setCadastroWarning('*Email já cadastrado!');
                }
            }
            else {
                console.log(error);
            }
        });
    }

    function handleLogin(e: FormEvent) {
        e.preventDefault();
        setLoading(true);

        if(!emailLogin || !senhaLogin) {
            setShowLoginWarning(true);
            setLoginWarning('*Campo não inserido!');
            setLoading(false);

            return;
        }

        api.post('/session', {
            email: emailLogin,
            password: senhaLogin
        }).then((response) => {
            const token = response.data.token;
            functions.setToken(token);

            const user = response.data.user;
            localStorage.setItem('user', JSON.stringify(user));
            addUserData(user);

            const userId = functions.getIdByToken(token);
    
            api.get(`/playlist/${userId}`, {
                headers: {
                    Authorization: `${token}`
                }
            }).then((response) => {
                const playlists = response.data.sort();

                playlists.sort(function (a: PlaylistProps, b: PlaylistProps) {
                    if (a.title > b.title) {
                      return 1;
                    }
                    if (a.title < b.title) {
                      return -1;
                    }
                    return 0;
                });

                addPlaylistData(playlists);
                setLoading(false);
                history.push('/home');
            }).catch((error: AxiosError) => {
                setLoading(false);
                if(error.response) {
                    const isTokenValid = error.response.data.auth;
                    const errorMessage = error.response.data.message;

                    if(isTokenValid === false) {
                        handleLogout(errorMessage);
                    }
                }
                else {
                    console.log(error);
                }
            })
        }).catch((error: AxiosError) => {
            setLoading(false);
            if(error.response) {
                if(error.response.data.error === 'User not found!') {
                    setShowLoginWarning(true);
                    setLoginWarning('*Email Incorreto!');
                }
                else if(error.response.data.error === 'Incorrect User or Password!') {
                    setShowLoginWarning(true);
                    setLoginWarning('*Email ou Senha Incorreta!');
                }
            }
            else {
                console.log(error);
            }
        })
    }

    function sendMail() {
        api.post("/sendMail", {
            email: recoverEmail
        }).then(response => {
            setShowPasswordWarning(true);
            setPasswordWarning('*Email enviado!');
        }).catch((error: AxiosError) => {
            if(error.response) {
                if(error.response.data.error === 'User not found!') {
                    setShowPasswordWarning(true);
                    setPasswordWarning('*Email Não Encontrado!');
                }
                else {
                    setShowPasswordWarning(true);
                    setPasswordWarning('*Falha ao enviar Email!');
                }
            }
            else {
                console.log(error);
            }
        });
    }

    return (
        <div id="cadastro" style={loading ? {cursor: 'progress'} : {cursor: 'default'}}>

            { showPasswordPopup &&
                <div id="show-password-popup">
                    <div id="overlay" onClick={() => setShowPasswordPopup(false)}></div>

                    <div id="show-password-container">
                        <h2>Recuperar Senha</h2>
                        <div id="password-inputs">
                            <div id="password-inputs-text">
                                <label htmlFor="email-recover">Insira seu Email</label>
                                <input onChange={(e) => setRecoverEmail(e.target.value)} type="email" name="" id="email-recover" placeholder="Insira seu E-mail" />
                            </div>
                            <button onClick={sendMail} >Enviar</button>
                     
                            <span 
                                style={ showPasswordWarning ? {visibility: 'visible'} : {visibility: 'hidden'} } 
                                id="warning-password" >
                                {passwordWarning}
                            </span>
                        </div>
                    </div>
                </div>
            }

            { showTermsPopup &&
                <div id="show-terms-popup">
                    <div id="overlay" onClick={() => setShowTermsPopop(false)}></div>

                    <div id="show-terms-container">
                        <h2>Termos de Serviço</h2>

                        <p>
                            Ao assinar este Termo de Uso, você se submete a não reproduzir, distribuir, transmitir, exibir, 
                            vender, licenciar, alterar e/ou modificar qualquer parte dos conteúdos baixados no DownFast com a 
                            finalidade de obter lucro, exceto mediante uma permissão prévia dos respectivos detentores dos direitos.
                             No caso de não cumprimento deste contrato, o DownFast não se responsabilizará por seus atos e não 
                             assumirá as consequências.
                        </p>
                    </div>
                </div>
            }

            <div id="form-container">
                <div id="informations">
                    <div id="informations-text">
                        <img src={logo} alt="Logo DownFast" />
                        <h2>Plataforma Web para download de vídeos do Youtube</h2>
                    </div>
                </div>

                {/* Cadastro */}
                <div className="form-cadastro" ref={form_cadastro} >
                    <form id="form1" onSubmit={handleCreateUser} method="post">
                        <h2>Cadastre-se</h2>
                        <Input
                                name="nome" 
                                placeholder="Nome Completo" 
                                type="text"
                                value={name} 
                                maxLength={40}
                                onChange={ (e) => {setName(e.target.value) } }
                        />
                        <Input 
                                name="email" 
                                placeholder="Email" 
                                type="email"
                                value={emailCadastro} 
                                maxLength={40}
                                onChange={ (e) => {setEmailCadastro(e.target.value) } }
                        />
                        <Input 
                                name="username" 
                                placeholder="Username" 
                                type="text"
                                value={username} 
                                maxLength={24}
                                onChange={ (e) => {setUsername(e.target.value) } }
                        />
                        <Input 
                                name="password" 
                                placeholder="Senha" 
                                type="password"
                                value={senhaCadastro1} 
                                onChange={ (e) => {setSenhaCadastro1(e.target.value) } }
                        />
                        <Input
                                name="password"
                                placeholder="Repetir Senha"
                                type="password"
                                value={senhaCadastro2} 
                                onChange={ (e) => {setSenhaCadastro2(e.target.value) } }
                        />

                        <div id="terms">
                            <input type="checkbox" id="service-term" name="service-term" onClick={() => setTerms(!terms)} />
                            <label htmlFor="service-term">Eu li e aceito os </label> <span onClick={() => setShowTermsPopop(true)} id="open-terms"> Termos de Serviços</span>
                        </div>

                        <span 
                            style={ showCadastroWarning ? {visibility: 'visible'} : {visibility: 'hidden'} } 
                            id="warning-cadastro" >
                            {cadastroWarning}
                        </span>

                        <div className="buttons-container">
                            <button id="submit-cadastro" type="submit">
                                Cadastrar
                            </button>

                            <button onClick={changeScreen} className="login-button" type="button" >Já está cadastrado? Clique aqui para fazer seu Login!</button>
                        </div>
                    </form>
                </div>

                {/* Login */}
                <div className="hide-screen form-login" ref={form_login} >
                    <form id="form2" onSubmit={handleLogin} method="post">
                        <h2>Entrar no Downfast</h2>
                        <Input 
                                name="email_login" 
                                placeholder="Email" 
                                type="email"
                                value={emailLogin} 
                                onChange={ (e) => {setEmailLogin(e.target.value) } }
                        />
                        <Input 
                                name="password_login" 
                                placeholder="Senha" 
                                type="password"
                                value={senhaLogin} 
                                onChange={ (e) => {setSenhaLogin(e.target.value) } }
                        />

                        <span 
                            style={ showLoginWarning ? {visibility: 'visible'} : {visibility: 'hidden'} } 
                            id="warning-login" >
                            {loginWarning}
                        </span>

                        <div className="buttons-container">
                            <button id="submit-login" type="submit">
                                Entrar
                            </button>
                            <div className="bottom-links">
                                <button onClick={() => setShowPasswordPopup(true)} className="forgot-password" type="button" >Esqueceu sua senha?</button>
                                <button onClick={changeScreen} className="cadastro-button" type="button" >Inscreva-se no Downfast</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Cadastro;