import React, { useEffect, useState } from 'react';

import { VideosInformations } from './Home2';
import NavBar from '../components/Navbar/index';
import Functions from '../functions/Functions';

import api from '../services/api';

import { AxiosError } from 'axios';

import '../styles/pages/studio.css';

interface StudioProps {
    videos: VideosInformations[]
}

const Studio: React.FC<StudioProps> = (props) => {
    const functions = new Functions();

    const [videosList, setVideosList] = useState<VideosInformations[]>([]);
    const [filteredVideo, setFilteredVideo] = useState<VideosInformations>();

    useEffect(() => {
        const token = functions.getToken();

        if(token) {
            api.get('/verify', {
                headers: {
                    "Authorization": `${token}`
                }
            }).then(response => {
                // console.log(response);
            }).catch((error: AxiosError) => {
                if(error.response) {
                    const isTokenValid = error.response.data.auth;
                    // const errorMessage = error.response.data.message;

                    if(isTokenValid === false) {
                        // handleLogout(errorMessage);
                    }
                }
                else {
                    console.error(error);
                }
            })
        }
        else {
            // handleLogout('Failed to Authenticate');
        }

        const videosStorage = localStorage.getItem('videos');

        if(videosStorage) {
            if(videosStorage.length > 0) {
                const allVideos = JSON.parse(videosStorage);

                setVideosList(allVideos);
                setFilteredVideo(allVideos[0]);
            }
            else {
                // console.log('Não há vídeos');
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function selectCurrentVideo(video: VideosInformations) {
        setFilteredVideo(video);
    }

    return(
        <div id='studio-landing'>
            <NavBar page={2} page_title={"Studio"} />   

            <div className="studio-container">
                <div id="page-title">
                    <h2>Estúdio de Corte de Vídeos</h2>
                </div>

                <div id="studio-content">
                    <div className="content-div" id='waiting-videos'>
                        <div className="box-title">
                            <h2>Fila de Espera ({videosList.length})</h2>
                        </div>
                        <div className="box-content">
                            {videosList.map((item, index) => {
                                return(
                                    <div 
                                        className="box-line" 
                                        key={index}
                                        onClick={() => selectCurrentVideo(item)}
                                    >
                                        <span title={item.name}>{item.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="content-div" id='current-video' >
                        <div id="video-informations">
                            <h2 title={filteredVideo?.name} >{filteredVideo?.name}</h2>

                            <div id="video-exibition">
                                <iframe 
                                    width="100%" 
                                    height="260" 
                                    src="https://www.youtube.com/embed/LlvBzyy-558"
                                    title="YouTube video player" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                >
                                </iframe>
                            </div>
                        </div>

                        <div id="video-time-informations">

                        </div>

                        <div id="video-buttons">
                            
                        </div>

                    </div>

                    <div className="content-div" id='ready-videos'>
                        <h2>wdadawdawdaw</h2>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Studio;