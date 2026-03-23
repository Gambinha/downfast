import React, { useContext, useEffect, useState } from 'react';

import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';

import '../styles/pages/library.css';

import Navbar from '../components/Navbar';
import ConfirmationWindow from '../components/ConfirmationWindow';
import CreatePlaylistBox from '../components/CreatePlaylistBox';

import { getIdByToken } from '../functions/Functions';
import { UserContext } from '../contexts/userData';
import { useNavigate } from 'react-router-dom';

import {
    getPlaylists,
    updatePlaylist as updatePlaylistService,
    deletePlaylist as deletePlaylistService,
} from '../services/playlistService';
import type { PlaylistProps, PlaylistVideosProps } from '../types/api';


function Library() {
    const navigate = useNavigate();
    const emptyArray: PlaylistProps = {
        id: '',
        title: '',
        genre: '',
        likes: 0,
        security: '',
        keywords: [],
        videos: []
    }

    const {addPlaylistData, addVideosData, removeAllVideosData} = useContext(UserContext);

    const [playlists, setPlaylists] = useState<PlaylistProps[]>([]);
    const [filteredPlaylists, setFilteredPlaylists] = useState<PlaylistProps[]>([]);

    const [playlistName, setPlaylistName] = useState<string>('');
    const [genderName, setGenderName] = useState<string>('');
    const [keywordName, setKeywordName] = useState<string>('');

    const [playlistShowed, setPlaylistShowed] = useState<PlaylistProps>(emptyArray);
    const [showPopup, setShowPopup] = useState(false);

    const [showConfirmationWindow, setShowConfirmationWindow] = useState(false);
    const [confirmationWindow, setConfirmationWindow] = useState('');

    const [showCreatePlaylist, setShowCreatePlaylist] = useState<boolean>(false);
    const [playlistsWasUpdated, setPlaylistsWasUpdated] = useState<boolean>(false);

    const [editedTitle, setEditedTitle] = useState<string>('');
    const [editedVideos, setEditedVideos] = useState<PlaylistVideosProps[]>([]);
    const [editedGender, setEditedGender] = useState<string>('');
    const [editedSecurity, setEditedSecurity] = useState<string>('');
    const [editedOnlyKeyword, setEditedOnlyKeyword] = useState<string>('');
    const [editedKeywords, setEditedKeywords] = useState<string[]>([]);

    const [updateOperation, setUpdateOperation] = useState(false);
    const [removeOperation, setRemoveOperation] = useState(false);

    const [wasUpdated, setWasUpdated] = useState(false);

    const input_keywords = React.createRef<HTMLInputElement>();

    if(showPopup) {
        document.body.classList.add('active-popup');
    } else {
        document.body.classList.remove('active-popup');
    }

    useEffect(() => {
        handleGetPlaylists();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (playlistName != null) {
            let filtered = playlists.filter((playlist) => {
              return playlist.title.toLowerCase().indexOf(playlistName.toLowerCase()) !== -1;
            });
            setFilteredPlaylists(filtered);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistName]);

    useEffect(() => {
        if (genderName != null) {
            let filtered = playlists.filter((playlist) => {
              return playlist.genre.toLowerCase().indexOf(genderName.toLowerCase()) !== -1;
            });
            setFilteredPlaylists(filtered);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [genderName]);

    useEffect(() => {
        if (keywordName !== null && keywordName !== '') {
            const currentKeyword = keywordName.toLowerCase();
            let filtered: PlaylistProps[] = [];
            playlists.forEach((playlist) => {
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
        if(updateOperation === true) {
            setUpdateOperation(false);

            if(confirmationWindow === 'true') {
                const updatedPlaylist: PlaylistProps = {
                    id: playlistShowed.id,
                    title: editedTitle,
                    genre: editedGender,
                    security: editedSecurity,
                    likes: playlistShowed.likes,
                    keywords: editedKeywords,
                    videos: editedVideos
                };

                updatePlaylistService({ updatedPlaylist })
                    .then(() => {
                        setShowPopup(false);
                        handleGetPlaylists();
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        }

        if(removeOperation === true) {
            setRemoveOperation(false);

            if(confirmationWindow === 'true') {
                deletePlaylistService(playlistShowed.id)
                    .then(() => {
                        setShowPopup(false);
                        handleGetPlaylists();
                    })
                    .catch((error) => {
                        console.error(error);
                    });
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

    async function handleGetPlaylists() {
        const token = localStorage.getItem('x-access-token');
        if(!token) return;

        const userId = getIdByToken(token);
        if(!userId) return;

        try {
            const playlistsData = await getPlaylists(userId);
            const sorted = [...playlistsData].sort(
                (a: PlaylistProps, b: PlaylistProps) => a.title.localeCompare(b.title)
            );
            setPlaylists(sorted);
            setFilteredPlaylists(sorted);
            addPlaylistData(sorted);
        } catch {
            // Auth errors handled by interceptor
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

        navigate('/home');
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
