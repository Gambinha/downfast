import React, { useContext, useEffect, useState } from 'react';

import '../styles/pages/feed.css';

import Navbar from '../components/Navbar';
import ConfirmationWindow from '../components/ConfirmationWindow';

import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';

import {AxiosError} from 'axios';

import api from '../services/api';
import Functions from '../functions/Functions';

import { UserContext } from '../contexts/userData';
import {PlaylistVideosProps} from './Library';
import { useHistory } from 'react-router-dom';

interface PlaylistProps {
    id: string;
    title: string;
    genre: string;
    likes: number;
    security: string;
    keywords: Array<string>;
    videos: Array<PlaylistVideosProps>;
    user_id: {
        id: string,
        username: string
    };
    likedByUser: boolean;
}
function Feed() {
    const functions = new Functions();
    const history = useHistory();

    const {userData, addUserData, playlistData} = useContext(UserContext);

    const [playlistName, setPlaylistName] = useState<string>('');
    const [genderName, setGenderName] = useState<string>('');
    const [keywordName, setKeywordName] = useState<string>('');

    const [playlists, setPlaylists] = useState<PlaylistProps[]>([]);
    const [filteredPlaylists, setFilteredPlaylists] = useState<PlaylistProps[]>([]);

    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [selectedPlaylists, setSelectedPlaylists] = useState<PlaylistProps>();

    //Confirmation Window
    const [showConfirmationWindow, setShowConfirmationWindow] = useState(false);
    const [confirmationWindow, setConfirmationWindow] = useState('');

    //updatePlaylist    
    const [showupdatePlaylist, setShowUpdatePlaylist] = useState<boolean>(false);

    //Saber qual operação foi chamada
    const [copyOperation, setCopyOperation] = useState(false);
    
    if(showDetails) {
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
        handleGetAllPlaylists();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // useEffect(() => {
    //     console.log('Teste');
    //     // console.log(playlists);
    // }, [playlists]);

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
            if(copyOperation === true) {
                setCopyOperation(false);
    
                if(confirmationWindow === 'true') {
                    if(selectedPlaylists) {
                        if(selectedPlaylists.user_id.id !== userData.id) {
                            api.post('/playlist', {
                                title: selectedPlaylists.title,
                                genre: selectedPlaylists.genre,
                                security: 'private',
                                likes: 0,
                                videos: selectedPlaylists.videos,
                                keywords: selectedPlaylists.keywords,
                                user_id: userData.id
                            }, {
                                headers: {
                                    "Authorization": `${token}`
                                }
                            }).then(response => {
                                alert('Playlist criada com sucesso!');
    
                                setShowDetails(false);
                                handleGetAllPlaylists();
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
                            alert('Esta Playlist já é sua!');
                        }
                    }
                }
                else {
                    // console.log('its false');
                }
            }
        }

        setConfirmationWindow('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmationWindow]);

    function handleGetAllPlaylists() {
        const token = functions.getToken();

        if(token) {
            api.post('/playlist/getAll', {
                onlyPublic: true
            }, {
                headers: {
                    "Authorization": `${token}`
                }
            }).then((response) => {
                const gotPlaylist = response.data;

                const newPlaylist = gotPlaylist.map((playlist: PlaylistProps) => {
                    const playlistInfos = {
                        id: playlist.id,
                        title: playlist.title,
                        genre: playlist.genre,
                        security: playlist.security,
                        likes: playlist.likes,
                        videos: playlist.videos,
                        keywords: playlist.keywords,
                        user_id: playlist.user_id,
                        likedByUser: false
                    }
                    
                    const userStorage = localStorage.getItem('user');
                    if(userStorage) {
                        const playlistsList = JSON.parse(userStorage).likedsPlaylists;
                        let index = playlistsList.indexOf(playlist.id);

                        if (index > -1) {
                            playlistInfos.likedByUser = true;
                        }
                        else {
                            playlistInfos.likedByUser = false;
                        }
                    }

                    return playlistInfos;
                });


                setPlaylists(newPlaylist);
                setFilteredPlaylists(newPlaylist);
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

    function showPlaylistDetails(index: number) {
        setSelectedPlaylists(filteredPlaylists[index]);
        changeShowDetails();
    }

    function changeShowDetails() {
        setShowDetails(!showDetails);
    }

    function copyPlaylist() {
        setCopyOperation(true);
        setShowConfirmationWindow(true);
    }

    function handleLike(id: string) {
        let currentPlaylist = playlists;
        const token = functions.getToken();

        if(token) {
            currentPlaylist.forEach(playlist => {
                if(playlist.id === id) {
                    let playlistList = userData.likedsPlaylists;
                    const newUser = {
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        username: userData.username,
                        likedsPlaylists: userData.likedsPlaylists,
                        role: userData.role
                    }
                    const updatedPlaylist = {
                        id: playlist.id,
                        title: playlist.title,
                        genre: playlist.genre,
                        security: playlist.security,
                        likes: playlist.likes,
                        keywords: playlist.keywords,
                        videos: playlist.videos
                    }
                    
                    if(playlist.likedByUser === true) { 
                        updatedPlaylist.likes -= 1; 

                        const index = playlistList.indexOf(playlist.id);
                        playlistList.splice(index, 1);
    
                        api.put('/playlist', {
                            updatedPlaylist
                        }, {
                            headers: {
                                "Authorization": `${token}`
                            }
                        }).then(response => {
                            //Atualizar Lista de Playlists do User
                            api.put('/users/playlists', {
                                user_id: userData.id,
                                playlists_id: playlistList
                            }, {
                                headers: {
                                    "Authorization": `${token}`
                                }
                            }).then(response => {
                                // console.log(response);
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

                        newUser.likedsPlaylists = playlistList;
                        addUserData(newUser);
    
                        playlist.likes -= 1;
                        playlist.likedByUser = false;
                        return;
                    }
                    if(playlist.likedByUser === false) {
                        updatedPlaylist.likes += 1;  
                        playlistList.push(playlist.id);
  
                        api.put('/playlist', {
                            updatedPlaylist
                        }, {
                            headers: {
                                "Authorization": `${token}`
                            }
                        }).then(response => {
                           
                            api.put('/users/playlists', {
                                user_id: userData.id,
                                playlists_id: playlistList
                            }, {
                                headers: {
                                    "Authorization": `${token}`
                                }
                            }).then(response => {
                                // console.log(response);
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

                        newUser.likedsPlaylists = playlistList;
                        addUserData(newUser);

                        playlist.likes += 1;
                        playlist.likedByUser = true;
                        return;
                    }
                }
            })
        }

        setPlaylists([...currentPlaylist]);
        setFilteredPlaylists([...currentPlaylist]);
    }

    function showPlaylists() {
        setShowUpdatePlaylist(true);
    }

    function unshowUpdatePopup() {
        setShowUpdatePlaylist(false);
    }

    function addVideosToPlaylist(index: number) {
        const playlist_id = playlistData[index].id;
        const token = functions.getToken();

        if(token) {
            if(selectedPlaylists) {
                if(selectedPlaylists.videos.length > 0) {
                    api.put(`/playlist/${userData.id}/${playlist_id}`, {
                        updatedVideos: selectedPlaylists.videos
                    }, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then(response => {
                        alert('Videos adicionados com Sucesso!');
                        unshowUpdatePopup();
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
                    alert('Esta Playlist não possui vídeos!');
                    unshowUpdatePopup();
                }
            }
        }    
    }

    return(
        <div id="feed-landing">
            <Navbar page={3} page_title={'Feed'}/>

            { showupdatePlaylist &&   
                <div id="playlists-list-container">
                    <div id="overlay" onClick={unshowUpdatePopup} ></div>
                    <div id="playlists-list-popup">
                        <h2>Seleciona sua Playlist</h2>

                        <div id="playlists-list-box">
                            {playlistData.map((playlist, index) => {
                                return(
                                    <div className="each-playlist" key={index} >
                                        <div className="each-playlist-infos">
                                            <h3 title={playlist.title} >{playlist.title}</h3>
                                            <span>{playlist.genre}</span>
                                        </div>
                                        <div className="add-to-playlist-button">
                                            <button onClick={() => addVideosToPlaylist(index)} >+</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            }

            <div className='feed-container'>
                <div id="search-bar">
                    <h2>Procurar Playlists</h2>

                    <div id="search-bar-inputs">
                        <input type="text" name="" id="playlist-name" placeholder="Nome da Playlist" onChange={(e) => 
                            setPlaylistName(e.target.value)} 
                        />

                        <input type="text" name="" id="gender-name" placeholder="Gênero da Playlist"
                            onChange={(e) => setGenderName(e.target.value)} 
                        />
                        
                        <input type="text" name="" id="keywords-name" placeholder="Palavras-Chaves" 
                            onChange={(e) => setKeywordName(e.target.value)} 
                        />
                    </div>
                </div>

                <div id="playlists-container">
                {filteredPlaylists.map((playlist, index) => {
                    return(
                        <div className="playlist" key={index} >
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
    
                            <div className="infos">
                                <div id="infos-box">
                                    <h4 title={playlist.genre} id='h4-gender' >Gênero: {playlist.genre}</h4>
                                    <h4 title={playlist.user_id.username} >From: {playlist.user_id.username}</h4>
                                </div>

                                <div className="infos-likes">
                                    <button className="heart-like" onClick={() => handleLike(playlist.id)} >
                                        {playlist.likedByUser ? <AiIcons.AiFillHeart size={30} color="red" /> : <AiIcons.AiOutlineHeart size={30} />}
                                    </button>
                                    <span color={playlist.likedByUser ? "red" : "green"} >{playlist.likes}</span>
                                </div>
                            </div>
    
                            <button onClick={() => showPlaylistDetails(index)} >
                                Ver Detalhes
                            </button>
                        </div>
                    );
                })}
                </div>
            </div>

            {showDetails && 
                <div id="popup">
                    <div id="overlay" onClick={changeShowDetails} ></div>
                    <div id="particular-playlist">
                        <div id="particular-playlist-title">
                            <h2 title={selectedPlaylists?.title} >{selectedPlaylists?.title}</h2>
                        </div>

                        <div id="particular-videos-container">
                            <div id="particular-videos-list-title">
                                <h2>Lista de Vídeos</h2>
                            </div>

                            <div id="particular-videos-box">
                                {selectedPlaylists?.videos.map((video, index) => {
                                    return(
                                        <div className="particular-box-line" key={index} >
                                            <div className="box-line-start">
                                                <BsIcons.BsMusicNoteBeamed fontSize='.9em'/>
                                                <p title={video.name}>{video.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div id="particular-infos-security-box">
                            <div id="particular-infos-box">
                                <h3 title={selectedPlaylists?.genre} >Gênero: {selectedPlaylists?.genre}</h3>
                                <h3 title={selectedPlaylists?.user_id.username} >From: {selectedPlaylists?.user_id.username}</h3>
                            </div>

                            <div className="particular-infos-likes">
                                <button className="heart-like" onClick={() => {if(selectedPlaylists) {handleLike(selectedPlaylists.id)} }} >
                                    {selectedPlaylists?.likedByUser ? <AiIcons.AiFillHeart size={30} color="red" /> : <AiIcons.AiOutlineHeart size={30} />}
                                </button>
                                <span color={selectedPlaylists?.likedByUser ? "red" : "green"} >{selectedPlaylists?.likes}</span>
                            </div>
                        </div>

                        <div id="particular-buttons-container">
                            <button id="copy-playlists-video" onClick={showPlaylists} >Copiar Vídeos</button>
                            <button id="copy-playlist" onClick={copyPlaylist} >Copiar Playlist</button>
                        </div>

                        <button id="close-popup" onClick={changeShowDetails} >
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

export default Feed;