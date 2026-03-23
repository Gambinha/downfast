import React, { Dispatch, SetStateAction, useContext, useState } from "react";

import './style.css';

import * as AiIcons from 'react-icons/ai';
import { UserContext } from "../../contexts/userData";
import { createPlaylist } from "../../services/playlistService";

interface CreatePlaylistBoxProps {
    videos?: Array<{
        name: string;
        url: string;
    }>
    setCreatePlaylistWindow: Dispatch<SetStateAction<boolean>>
    wasUpdated?: Dispatch<SetStateAction<boolean>>
    previousPage: string
}

const CreatePlaylistBox: React.FC<CreatePlaylistBoxProps> = (props) => {
    const {userData} = useContext(UserContext);

    const [keywords, setKeywords] = useState<string>('');
    const [keywordsList, setKeywordsList] = useState<string[]>([]);

    const [security, setSecurity] = useState<string>('public');
    const [title, setTitle] = useState<string>('');
    const [gender, setGender] = useState<string>('');

    const input_keywords = React.createRef<HTMLInputElement>();

    async function handleCreatePlaylist() {
        if(title !== '' && gender !== '') {
            try {
                await createPlaylist({
                    title,
                    genre: gender,
                    security,
                    likes: 0,
                    videos: props.videos || [],
                    keywords: keywordsList,
                    user_id: userData.id
                });

                alert('Playlist criada com sucesso!');

                if(props.wasUpdated) {
                    props.wasUpdated(true);
                }
                props.setCreatePlaylistWindow(false);
            } catch {
                // Auth errors handled by interceptor
                console.error('Erro ao criar playlist');
            }
        } else {
            alert('Título ou Gênero Incompleto!');
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
                        <label htmlFor="keywords">Palavras-Chaves</label>

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
