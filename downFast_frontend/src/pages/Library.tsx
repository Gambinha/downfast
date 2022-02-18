import React, { useContext, useEffect, useState } from 'react';
// import {useHistory} from 'react-router-dom';

import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';

import '../styles/pages/library.css';

import {AxiosError} from 'axios';

import Navbar from '../components/Navbar';
import ConfirmationWindow from '../components/ConfirmationWindow';
import CreatePlaylistBox from '../components/CreatePlaylistBox';

import api from '../services/api';
import Functions from '../functions/Functions';
import { UserContext } from '../contexts/userData';
import { useHistory } from 'react-router-dom';


export interface PlaylistVideosProps {
    name: string;
    url: string;
}

export interface PlaylistProps {
    id: string;
    title: string;
    genre: string;
    likes: number;
    security: string;
    keywords: Array<string>;
    videos: Array<PlaylistVideosProps>;
}


function Library() {
    const history = useHistory();
    const emptyArray = {
        id: '', 
        title: '', 
        genre: '', 
        likes: 0, 
        security: '', 
        keywords: [], 
        videos: []
    }

    const {addUserData, addPlaylistData, addVideosData, removeAllVideosData} = useContext(UserContext);

    const [playlists, setPlaylists] = useState<PlaylistProps[]>([]);
    const [filteredPlaylists, setFilteredPlaylists] = useState<PlaylistProps[]>([]);

    const [playlistName, setPlaylistName] = useState<string>('');
    const [genderName, setGenderName] = useState<string>('');
    const [keywordName, setKeywordName] = useState<string>('');

    const [playlistShowed, setPlaylistShowed] = useState<PlaylistProps>(emptyArray);
    const [showPopup, setShowPopup] = useState(false);

    //Confirmation Window
    const [showConfirmationWindow, setShowConfirmationWindow] = useState(false);
    const [confirmationWindow, setConfirmationWindow] = useState('');

    //Create Playlist Window
    const [showCreatePlaylist, setShowCreatePlaylist] = useState<boolean>(false);
    const [playlistsWasUpdated, setPlaylistsWasUpdated] = useState<boolean>(false);

    // Alterar Playlist
    const [editedTitle, setEditedTitle] = useState<string>('');
    const [editedVideos, setEditedVideos] = useState<PlaylistVideosProps[]>([]);
    const [editedGender, setEditedGender] = useState<string>('');
    const [editedSecurity, setEditedSecurity] = useState<string>('');
    const [editedOnlyKeyword, setEditedOnlyKeyword] = useState<string>('');
    const [editedKeywords, setEditedKeywords] = useState<string[]>([]);

    //Saber qual operação foi chamada
    const [updateOperation, setUpdateOperation] = useState(false);
    const [removeOperation, setRemoveOperation] = useState(false);

    const [wasUpdated, setWasUpdated] = useState(false);

    const functions = new Functions();

    const input_keywords = React.createRef<HTMLInputElement>();

    if(showPopup) {
        document.body.classList.add('active-popup');
    } else {
        document.body.classList.remove('active-popup');
    }

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
        handleGetPlaylists();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (playlistName != null) {
            let playlists_array = playlists;
            let filtered = playlists_array.filter((playlist) => {
              return playlist.title.toLowerCase().indexOf(playlistName.toLowerCase()) !== -1;
            });
      
            setFilteredPlaylists(filtered);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistName]);

    useEffect(() => {
        if (genderName != null) {
            let playlists_array = playlists;
            let filtered = playlists_array.filter((playlist) => {
              return playlist.genre.toLowerCase().indexOf(genderName.toLowerCase()) !== -1;
            });
      
            setFilteredPlaylists(filtered);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [genderName]);

    useEffect(() => {
        if (keywordName !== null && keywordName !== '') {
            const currentKeyword = keywordName.toLowerCase();

            let playlists_array = playlists;
            let filtered: PlaylistProps[] = [];

            playlists_array.forEach((playlist) => {
                playlist.keywords.forEach((keyword) => {
                    if(keyword === currentKeyword) {
                        filtered.push(playlist);    
                    }
                })
            });     
            setFilteredPlaylists(filtered);
        } else if(keywordName === '') {
            setFilteredPlaylists(playlists);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keywordName]);

    useEffect(() => {
        const token = functions.getToken();

        if(token) {
            if(updateOperation === true) {
                console.log('entrou1');
                setUpdateOperation(false);
    
                if(confirmationWindow === 'true') {
                    console.log('entrou2');
                    const updatedPlaylist = {
                        id: playlistShowed.id,
                        title: editedTitle,
                        genre: editedGender,
                        security: editedSecurity,
                        likes: playlistShowed.likes,
                        keywords: editedKeywords,
                        videos: editedVideos
                    }
        
                    api.put('/playlist', {
                        updatedPlaylist
                    }, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then(response => {
                        console.log('Atualizou Certin');
                        setShowPopup(false);
                        handleGetPlaylists();
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
                    console.log('its false');
                }
            }
    
            if(removeOperation === true) {
                setRemoveOperation(false);

                if(confirmationWindow === 'true') {
                    const playlist_id = playlistShowed.id;

                    //chamar api para excluir playlist
                    api.delete(`/playlist/${playlist_id}`, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then((response) => {
                        setShowPopup(false);
                        handleGetPlaylists();
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
                    console.log('its false');
                }

            }
        }
        setConfirmationWindow('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmationWindow]);

    useEffect(() => {
        if(playlistsWasUpdated === true) {
            handleGetPlaylists();
            setPlaylistsWasUpdated(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistsWasUpdated])

    // useEffect(() => {
    //     console.log(playlists);
    // }, [playlists]);

    function handleGetPlaylists() {
        const token = functions.getToken();

        if(token) {
            const userId = functions.getIdByToken(token);
    
            api.get(`/playlist/${userId}`, {
                headers: {
                    "Authorization": `${token}`
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

                setPlaylists(playlists);
                setFilteredPlaylists(playlists);
                addPlaylistData(playlists);
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
    }

    function showPlaylistDetails(playlist: PlaylistProps) {
        setPlaylistShowed(playlist);
        handleTogglePopup();
        
        setEditedTitle(playlist.title);
        setEditedVideos(playlist.videos);
        setEditedGender(playlist.genre);
        setEditedKeywords(playlist.keywords);
        setEditedSecurity(playlist.security);

        setWasUpdated(false);
    }

    function handleTogglePopup() {
        setShowPopup(!showPopup);
    }

    function handleRemoveVideoFromPlaylist(position: number) {
        console.log(position);
        const newArray = [...editedVideos];
        newArray.splice(position, 1);

        setEditedVideos(newArray);
        setWasUpdated(true);
    }

    function handleUpdateKeywords() {
        const newArray = [...editedKeywords];
        newArray.push(editedOnlyKeyword.toLocaleLowerCase());

        setEditedKeywords(newArray);
        setWasUpdated(true);

        if(input_keywords.current) {
            input_keywords.current.value = '';
        }
    }

    function handleToggleToPrivate() {
        setEditedSecurity('private');
        setWasUpdated(true);
    }

    function handleToggleToPublic() {
        setEditedSecurity('public');
        setWasUpdated(true);
    }

    function handleRemoveKeyword(index: number) {
        const newArray = [...editedKeywords];
        newArray.splice(index, 1);

        setEditedKeywords(newArray);
        setWasUpdated(true);
    }

    function handleSaveUpdates() {
        if(wasUpdated === true) {
            setUpdateOperation(true);
            setShowConfirmationWindow(true);
        }
        else {
            alert('Não há alterações!');
        }
    }

    function handleRemovePlaylist() {
        setRemoveOperation(true);
        setShowConfirmationWindow(true);
    }

    function downloadPlaylist() {
        removeAllVideosData();
        addVideosData(playlistShowed.videos);

        history.push('/home');
    }

    function updateNamed(newValue: string, position: number) {
        const newArray = [...editedVideos];

        newArray[position].name = newValue;

        setEditedVideos(newArray);
        setWasUpdated(true);
    }

    return(
        <div id="library-landing">
            <Navbar page={2} page_title={'Library'}/>

            { showCreatePlaylist && 
                <CreatePlaylistBox
                    setCreatePlaylistWindow={setShowCreatePlaylist} 
                    previousPage={'Library'}
                    wasUpdated={setPlaylistsWasUpdated}
                >
                </CreatePlaylistBox>
            }


            <div className='library-container'>
                <div id="search-bar">
                    <h2>Minhas Playlists</h2>

                    <div id="search-bar-inputs">
                        <input type="text" name="" id="playlist-name" placeholder="Nome da Playlist" 
                            onChange={(e) => setPlaylistName(e.target.value)} 
                        />

                        <input type="text" name="" id="gender-name" placeholder="Gênero da Playlist"
                            onChange={(e) => setGenderName(e.target.value)} 
                        />
                        
                        <input type="text" name="" id="keywords-name" placeholder="Palavras-Chaves" 
                            onChange={(e) => setKeywordName(e.target.value)} 
                        />

                        <button id="create-playlist" onClick={() => setShowCreatePlaylist(true)} >
                            <AiIcons.AiOutlinePlus size="20" />
                        </button>
                    </div>
                </div>

                <div id="playlists-container">
                    {filteredPlaylists.map(playlist => {
                        return(
                            <div className="playlist" key={playlist.id} >
                                <div className="playlist-title">
                                    <h2 title={playlist.title} >{playlist.title}</h2>
                                </div>
        
                                <div className="videos-list">
                                    {playlist.videos.map((video, index) => {
                                        if(index < 4) {
                                            return(
                                                <div className="box-line" key={index} >
                                                    <BsIcons.BsMusicNoteBeamed fontSize='.9em'/>
                                                    <p title={video.name}>{video.name}</p>
                                                </div>
                                            );
                                        }
                                        else return null;
                                    })}
                                    { playlist.videos.length > 0 &&
                                        <span id="videos-lenght">
                                            ({playlist.videos.length} vídeos)
                                        </span>
                                    }
                                </div>
        
                                <div className="gender">
                                    <h3 title={playlist.genre} >{playlist.genre}</h3>
        
                                    {playlist.security === 'public' ? <AiIcons.AiFillUnlock size="30" /> : <AiIcons.AiFillLock size="30" /> }
                                </div>
        
                                <button onClick={() => showPlaylistDetails(playlist)} >
                                    Ver Detalhes
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showPopup && 
                <div id="popup">
                    <div id="overlay" onClick={handleTogglePopup} ></div>
                    <div id="particular-playlist">
                        <input 
                            type="text" 
                            name="" 
                            id="" 
                            defaultValue={playlistShowed.title} 
                            title={playlistShowed.title}
                            onChange={(e) => {setEditedTitle(e.target.value); setWasUpdated(true)}}
                        />

                        <div id="particular-videos-container">
                            <div id="particular-videos-list-title">
                                <h2>Lista de Vídeos</h2>
                            </div>

                            <div id="particular-videos-box">
                                {editedVideos.map((video, index) => {
                                    return(
                                        <div className="particular-box-line" key={index} >
                                            <div className="box-line-start">
                                                <BsIcons.BsMusicNoteBeamed fontSize='.9em'/>
                                                <input 
                                                    value={video.name}
                                                    title={video.name} 
                                                    onChange={(e) => updateNamed(e.target.value, index)}
                                                />
                                            </div>

                                            <div className="box-line-end">
                                                <button onClick={() => handleRemoveVideoFromPlaylist(index)} >
                                                    <BsIcons.BsFillTrashFill color='#7a0b0b' />
                                                </button>                                       
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div id="particular-gender-security-box">
                            <div id="particular-gender-box">
                                <span>Gênero:</span>
                                <input 
                                    value={editedGender}
                                    type="text" 
                                    id="gender-input" 
                                    onChange={(e) => {setEditedGender(e.target.value); setWasUpdated(true)}} 
                                />
                            </div>

                            <div id="particular-security-box">
                                <span>Segurança:</span>

                                <div id="security-choice">
                                    <button id="private-choice" 
                                        style={editedSecurity === 'private' ? {backgroundColor:"#c3f7ab"} : {backgroundColor:"#f1f1f1"} } 
                                        onClick={handleToggleToPrivate}
                                    >
                                        <AiIcons.AiFillLock size="24" color="black" />
                                    </button>
                                    <button id="public-choice"
                                        style={editedSecurity === 'public' ? {backgroundColor:"#c3f7ab"} : {backgroundColor:"#f1f1f1"} } 
                                        onClick={handleToggleToPublic}
                                    >
                                        <AiIcons.AiFillUnlock size="24" color="black" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div id="particular-keywords-box">
                            <div id="particular-keywords-title">
                                <h3>Palavras-Chaves:</h3>
                                <form action="" onSubmit={(event) => {event.preventDefault();}} >
                                    <input 
                                        type="text" 
                                        id="input-keywords" 
                                        placeholder="Adicionar Keywords"
                                        onChange={(e) => setEditedOnlyKeyword(e.target.value)} 
                                        ref={input_keywords}
                                    />
                                    <button type="submit" id="submit-keywords" onClick={handleUpdateKeywords} >Enviar</button>
                                </form>
                            </div>

                            <div id="particular-keywords-container">
                                {editedKeywords.map((keyword, index) => {
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

                        <div id="particular-buttons-container">
                            <button id="download-playlist" onClick={downloadPlaylist} >Download</button>
                            <button id="edit-playlist" onClick={handleSaveUpdates} >Salvar Alterações</button>
                            <button id="remove-playlist" onClick={handleRemovePlaylist} >Excluir Playlist</button>
                        </div>

                        <button id="close-popup" onClick={handleTogglePopup} >
                            <AiIcons.AiOutlineClose color="red" />
                        </button>
                    </div>

                    { showConfirmationWindow && 
                        <ConfirmationWindow 
                            setConfirmation={setConfirmationWindow} 
                            setShowConfirmationWindow={setShowConfirmationWindow} 
                        >
                        </ConfirmationWindow>
                    }
                </div>
            }

        </div>
    );
}

export default Library;