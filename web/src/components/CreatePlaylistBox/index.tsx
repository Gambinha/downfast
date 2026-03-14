import React, { Dispatch, SetStateAction, useContext, useState } from "react";

import './style.css';

import * as AiIcons from 'react-icons/ai';
import Functions from "../../functions/Functions";
import { UserContext } from "../../contexts/userData";
import api from "../../services/api";
import { useHistory } from "react-router-dom";
import { AxiosError } from "axios";

interface PlaylistVideosProps {
    videos?: Array<{
        name: string;
        url: string;
    }>
    setCreatePlaylistWindow: Dispatch<SetStateAction<boolean>>
    wasUpdated?: Dispatch<SetStateAction<boolean>>
    previousPage: string
}

const CreatePlaylistBox: React.FC<PlaylistVideosProps> = (props) => {
    const functions = new Functions();
    const history = useHistory();

    const {userData, addUserData} = useContext(UserContext);

    const [keywords, setKeywords] = useState<string>('');
    const [keywordsList, setKeywordsList] = useState<string[]>([]);

    const [security, setSecurity] = useState<string>('public');
    const [title, setTitle] = useState<string>('');
    const [gender, setGender] = useState<string>('');

    const input_keywords = React.createRef<HTMLInputElement>();

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

    function handleCreatePlaylist() {
        const token = functions.getToken();

        if(token) {
            //criar playlist

            if(title !== '' && gender !== '') {
                api.post('/playlist', {
                    title: title,
                    genre: gender,
                    security: security,
                    likes: 0,
                    videos: props.videos || [],
                    keywords: keywordsList,
                    user_id: userData.id
                }, {
                    headers: {
                        "Authorization": `${token}`
                    }
                }).then(response => {
                    alert('Playlist criada com sucesso!');

                    if(props.wasUpdated) {
                        props.wasUpdated(true);
                    }
                    props.setCreatePlaylistWindow(false);
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
                alert('Título ou Gênero Incompleto!');
            }
        }
    }

    function handleUpdateKeywordsList() {
        const newArray = [...keywordsList];
        newArray.push(keywords.toLocaleLowerCase());

        setKeywordsList(newArray);

        if(input_keywords.current) {
            input_keywords.current.value = '';
        }
    }

    function handleRemoveKeyword(index: number) {
        const newArray = [...keywordsList];
        newArray.splice(index, 1);

        setKeywordsList(newArray);
    }

    function cancel() {
        props.setCreatePlaylistWindow(false);
    }

    return(
        <div id="create-playlist-container">
            <div id="overlay" onClick={cancel}></div>

            <div id="create-playlist-box">
                <h2>Criar Playlist</h2>

                <div id="form">
                    <label htmlFor="title">Título</label>
                    <input type="text" name="title" id="playlist-title" maxLength={36} onChange={(e) => setTitle(e.target.value)} />

                    <div id="gender-security">
                        
                        <div id="gender-box">
                            <label htmlFor="genero">Gênero</label>
                            <input type="text" name="genero" id="playlist-genero" maxLength={24} onChange={(e) => setGender(e.target.value)}  />
                        </div>

                        <div id="security-box">
                            <label htmlFor="security">Segurança</label>
                            <div id="security-choice">
                                <button id="private-choice" 
                                    style={security === 'private' ? {backgroundColor:"#c3f7ab"} : {backgroundColor:"#f1f1f1"} } 
                                    onClick={() => setSecurity('private')}
                                >
                                    <AiIcons.AiFillLock size="24" color="black" />
                                </button>
                                <button id="public-choice"
                                    style={security === 'public' ? {backgroundColor:"#c3f7ab"} : {backgroundColor:"#f1f1f1"} } 
                                    onClick={() => setSecurity('public')}
                                >
                                    <AiIcons.AiFillUnlock size="24" color="black" />
                                </button>
                            </div>
                        </div>

                    </div>

                    <div id="keywords-box">
                        <label htmlFor="keywords">Plavras-Chaves</label>
                        
                        <div id="keywords-box-input">
                            <form action="" onSubmit={(event) => {event.preventDefault();}} >
                                <input 
                                    type="text" 
                                    name="keywords"
                                    id="input-keywords" 
                                    placeholder="Adicionar Keywords"
                                    onChange={(e) => setKeywords(e.target.value)} 
                                    ref={input_keywords}
                                />
                                <button type="submit" id="submit-keywords" onClick={handleUpdateKeywordsList} >Enviar</button>
                            </form>
                        </div>

                        <div id="keywords-container">
                                {keywordsList.map((keyword, index) => {
                                    return(
                                        <span key={index} >
                                            #{keyword}
                                            <button id="remove-keyword" onClick={() => handleRemoveKeyword(index)} >
                                               X
                                            </button>
                                        </span>
                                    );
                                }) }
                            </div>
                    </div>
                </div>

                <div id="buttons-container">
                        <button id="cancel" onClick={cancel} >Cancelar</button>
                        <button id="create" onClick={handleCreatePlaylist} >Criar Playlist</button>
                </div>

            </div>
        </div>
    );
}

export default CreatePlaylistBox;