import React, { FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import '../styles/pages/cadastro.css';

import Input from '../components/Input';

import { setToken, getIdByToken } from '../functions/Functions';
import { UserContext } from "../contexts/userData";
import { AxiosError } from "axios";

import { login, register, sendMail } from "../services/authService";
import { getPlaylists } from "../services/playlistService";
import type { PlaylistProps, UserErrorResponse } from "../types/api";

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

    const navigate = useNavigate();

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

    function changeScreen() {
        if(form_cadastro.current && form_login.current) {
            form_cadastro.current.classList.toggle('hide-screen');
            form_login.current.classList.toggle('hide-screen');
        }

        setShowCadastroWarning(false);
        setShowLoginWarning(false);

        return;
    }

    async function handleCreateUser(e: FormEvent) {
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

        try {
            await register({
                name,
                email: emailCadastro,
                username,
                password: senhaCadastro1,
                role: "ROLE_USER"
            });
            setLoading(false);
            changeScreen();
            alert('Realizado com sucesso');
            setShowCadastroWarning(false);
        } catch (error) {
            setLoading(false);
            const axiosError = error as AxiosError<UserErrorResponse>;
            if(axiosError.response) {
                if(axiosError.response.data.error === 'User already exists') {
                    setShowCadastroWarning(true);
                    setCadastroWarning('*Email já cadastrado!');
                }
            } else {
                console.log(error);
            }
        }
    }

    async function handleLogin(e: FormEvent) {
        e.preventDefault();
        setLoading(true);

        if(!emailLogin || !senhaLogin) {
            setShowLoginWarning(true);
            setLoginWarning('*Campo não inserido!');
            setLoading(false);
            return;
        }

        try {
            const loginData = await login({
                email: emailLogin,
                password: senhaLogin
            });

            const token = loginData.token;
            setToken(token);

            const user = loginData.user;
            localStorage.setItem('user', JSON.stringify(user));
            addUserData(user);

            const userId = getIdByToken(token);

            if (userId) {
                try {
                    const playlistsData = await getPlaylists(userId);
                    const sortedPlaylists = [...playlistsData].sort(
                        (a: PlaylistProps, b: PlaylistProps) => a.title.localeCompare(b.title)
                    );
                    addPlaylistData(sortedPlaylists);
                } catch {
                    // Auth errors handled by interceptor
                }
            }

            setLoading(false);
            navigate('/home');
        } catch (error) {
            setLoading(false);
            const axiosError = error as AxiosError<UserErrorResponse>;
            if(axiosError.response) {
                if(axiosError.response.data.error === 'User not found!') {
                    setShowLoginWarning(true);
                    setLoginWarning('*Email Incorreto!');
                } else if(axiosError.response.data.error === 'Incorrect User or Password!') {
                    setShowLoginWarning(true);
                    setLoginWarning('*Email ou Senha Incorreta!');
                }
            } else {
                console.log(error);
            }
        }
    }

    async function handleSendMail() {
        try {
            await sendMail({ email: recoverEmail });
            setShowPasswordWarning(true);
            setPasswordWarning('*Email enviado!');
        } catch (error) {
            const axiosError = error as AxiosError<UserErrorResponse>;
            if(axiosError.response) {
                if(axiosError.response.data.error === 'User not found!') {
                    setShowPasswordWarning(true);
                    setPasswordWarning('*Email Não Encontrado!');
                } else {
                    setShowPasswordWarning(true);
                    setPasswordWarning('*Falha ao enviar Email!');
                }
            } else {
                console.log(error);
            }
        }
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
                            <button onClick={handleSendMail} >Enviar</button>

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
                        <h2>DownFast</h2>
                        <h2>Plataforma Desktop para download de vídeos do Youtube</h2>
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
