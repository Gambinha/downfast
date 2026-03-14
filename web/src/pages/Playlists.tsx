import { AxiosError } from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { UserContext } from '../contexts/userData';
import Functions from '../functions/Functions';
import api from '../services/api';

import * as BsIcons from 'react-icons/bs';
import * as MdIcons from 'react-icons/md';

import '../styles/pages/playlists.css';
import ConfirmationWindow from '../components/ConfirmationWindow';

import { PlaylistVideosProps } from './Library';

interface PlaylistProps {
    id: string;
    title: string;
    genre: string;
    keywords: Array<string>;
    videos: Array<PlaylistVideosProps>;
    user_id: {
        id: string,
        username: string
    };
}

function Playlists() {
    const functions = new Functions();
    const history = useHistory();

    const {addUserData} = useContext(UserContext);

    const [playlists, setPlaylists] = useState<PlaylistProps[]>([]);
    const [filteredPlaylists, setFilteredPlaylists] = useState<PlaylistProps[]>([]);
    const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideosProps[]>([]);

    const [playlistName, setPlaylistName] = useState<string>('');

    //Confirmation Window
    const [showConfirmationWindow, setShowConfirmationWindow] = useState(false);
    const [confirmationWindow, setConfirmationWindow] = useState('');

    const [removeOperation, setRemoveOperation] = useState(false);

    const [removedId, setRemovedId] = useState<string>('');
    const [removedIndex, setRemovedIndex] = useState<number>(0);

    const [showVideos, setShowVideos] = useState<boolean>(false);

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
        if (playlistName != null) {
            let users_array = [...playlists];
            let filtered = users_array.filter((user) => {
              return user.title.toLowerCase().indexOf(playlistName.toLowerCase()) !== -1;
            });
      
            setFilteredPlaylists(filtered);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistName]);

    useEffect(() => {
        const token = functions.getToken();

        if(token) {
            if(removeOperation === true) {
                setRemoveOperation(false);

                if(confirmationWindow === 'true') {   
                    api.delete(`/playlist/${removedId}`, {
                        headers: {
                            "Authorization": `${token}`
                        }
                    }).then(response => {
                        const currentPlaylists = [...playlists];
    
                        currentPlaylists.splice(removedIndex, 1);
    
                        setPlaylists(currentPlaylists);
                        setFilteredPlaylists(currentPlaylists);
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

        api.post('/playlist/getAll', {
            onlyPublic: false
        }, {
            headers: {
                "Authorization": `${token}`
            }
        }).then(response => {
            const playlists: PlaylistProps[] = response.data;

            setPlaylists(playlists);
            setFilteredPlaylists(playlists);
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

    function showPlaylistVideos(position: number) {
        const currentPlaylist = playlists[position];

        setPlaylistVideos(currentPlaylist.videos);
        setShowVideos(true);
    }

    return(
        <div id="playlists-landing">
            <Navbar page={6} page_title={'Playlists'}/>

            <div className="playlists-container">
                <div id="search-bar">
                    <h2>Lista de Playlists</h2>

                    <div id="search-bar-inputs">
                        <input type="text" name="" id="playlist-name" placeholder="Pesquisar Playlist" onChange={(e) => setPlaylistName(e.target.value)} />
                    </div>

                    <div id="playlists-container">
                        { filteredPlaylists.map((playlist, index) => {
                            return(
                                <div className="playlist" key={index}>
                                    <div className="playlist-infos">
                                        <MdIcons.MdFeaturedPlayList size={44} />
                                        <div className="playlist-infos-names">
                                            <h3 title={`${playlist.title} (${playlist.user_id.username})`} >{playlist.title} ({playlist.user_id.username})</h3>
                                            <span title={playlist.genre} >{playlist.genre}</span>
                                        </div>
                                    </div>

                                    <div className="playlist-actions">
                                        <div className="playlist-role">
                                            <button id="show-video" onClick={() => showPlaylistVideos(index)} >
                                                Mostrar Vídeos
                                            </button>
                                        </div>

                                        <button className="remove-playlist" 
                                            onClick={() => {
                                                setRemovedId(playlist.id);
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
                            );
                        })}
                    </div>

                    { showVideos &&
                        <div id="show-videos-popup">
                            <div id="overlay" onClick={() => setShowVideos(false)}></div>

                            <div id="show-videos-container">
                                <h2>Vídeos da Playlist</h2>
                                <div id="videos-list">
                                    {playlistVideos.map((video, index) => {
                                        return(
                                            <div className="box-line" key={index} >
                                                <BsIcons.BsMusicNoteBeamed fontSize='.9em'/>
                                                <p title={video.name}>{video.name}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
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
        </div>
    )
}

export default Playlists;