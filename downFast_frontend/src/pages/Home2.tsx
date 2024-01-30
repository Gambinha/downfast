import React, { useContext, useEffect, useState } from "react";
import io from "socket.io-client";

import * as AiIcons from "react-icons/ai";
import * as BsIcons from "react-icons/bs";
import * as HiIcons from "react-icons/hi";
import * as GrIcons from "react-icons/gr";
import * as MdIcons from "react-icons/md";

import async from "async";

import "../styles/pages/home2.css";

import Navbar from "../components/Navbar";
import api from "../services/api";
import CreatePlaylistBox from "../components/CreatePlaylistBox";

import Functions from "../functions/Functions";

import { UserContext } from "../contexts/userData";

import { AxiosError } from "axios";
import { useHistory } from "react-router-dom";

import blocoNotas from "../images/Bloco_Notas.png";

import dotenv from "dotenv";
dotenv.config();

export interface VideosInformations {
  name: string;
  url: string;
  embedUrl: string;
}

interface ProgressingVideosInformations {
  name: string;
  url: string;
  embedUrl: string;
  status: string;
  progress: number;
}

interface videosSearchProps {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail_url: string;
}

function Home() {
  const functions = new Functions();
  const history = useHistory();

  const [searchWarning, setSearchWarning] = useState("Teste");
  const [showSearchWarning, setShowSearchWarning] = useState(false);
  const [downloadWarning, setDownloadWarning] = useState("Teste");
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);

  const {
    userData,
    addUserData,
    playlistData,
    addVideoData,
    addVideosData,
    removeAllVideosData,
    removeOneVideoData,
  } = useContext(UserContext);

  const [videosArray, setVideosArray] = useState<VideosInformations[]>([]);
  const [testVideosArray, setTestVideosArray] = useState<VideosInformations>();
  const [progressingVideosArray, setProgressingVideosArray] = useState<
    ProgressingVideosInformations[]
  >([]);
  const [testProgressingVideosArray, setTestProgressingVideosArray] =
    useState<ProgressingVideosInformations>();

  const [searchedVideos, setSearchedVideos] = useState<videosSearchProps[]>([]);

  const [urlOrName, setUrlOrName] = useState<string>("url");

  const [downloadedVideosArray, setDownloadedVideosArray] = useState<
    VideosInformations[]
  >([]);

  const [videoLink, setVideoLink] = useState("");
  const [videoFormat, setVideoFormat] = useState("mp4");
  const [videoPath, setVideoPath] = useState("");

  const [showCreatePlaylist, setShowCreatePlaylist] = useState<boolean>(false);
  const [showupdatePlaylist, setShowUpdatePlaylist] = useState<boolean>(false);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [showSearchedVideos, setshowSearchedVideos] = useState<boolean>(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const input_link = React.createRef<HTMLInputElement>();

  const [file, setFile] = useState<File>();

  //Inserir link(true) ou arquivo(false)
  const [setVideos, setSetVideos] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);

  function handleLogout(message: string) {
    localStorage.removeItem("user");
    localStorage.removeItem("x-access-token");

    addUserData({
      id: "",
      name: "",
      email: "",
      username: "",
      likedsPlaylists: [""],
      role: "",
    });

    alert(message);
    history.push("/");
  }

  useEffect(() => {
    const token = functions.getToken();

    if (token) {
      api
        .get("/verify", {
          headers: {
            Authorization: `${token}`,
          },
        })
        .then((response) => {
          // console.log(response);
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            const isTokenValid = error.response.data.auth;
            const errorMessage = error.response.data.message;

            if (isTokenValid === false) {
              handleLogout(errorMessage);
            }
          } else {
            console.error(error);
          }
        });
    } else {
      handleLogout("Failed to Authenticate");
    }

    const videosStorage = localStorage.getItem("videos");

    if (videosStorage) {
      if (videosStorage.length > 0) {
        const allVideos = JSON.parse(videosStorage);

        const progressVideos = allVideos.map(
          (video: VideosInformations, index: number) => {
            const progressObject = {
              name: video.name,
              url: video.url,
              status: "waiting",
              progress: 0,
            };

            return progressObject;
          }
        );

        setVideosArray(allVideos);
        setProgressingVideosArray(progressVideos);
      } else {
        // console.log('Não há vídeos');
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (testVideosArray) {
      setVideosArray([...videosArray, testVideosArray]);

      addVideoData(testVideosArray);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testVideosArray]);

  useEffect(() => {
    if (testProgressingVideosArray) {
      setProgressingVideosArray([
        ...progressingVideosArray,
        testProgressingVideosArray,
      ]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testProgressingVideosArray]);

  async function searchByName(name: string) {
    setShowSearchWarning(false);

    api
      .get(
        `https://youtube.googleapis.com/youtube/v3/search?key=AIzaSyDYRPz8JUV6JaZtTfuv4A_zNdhAG8io3sc&type=video&part=snippet&maxResults=6&q=${name}`
      )
      .then((response) => {
        const currentSearchedVideos = response.data.items.map(
          (item: any, index: number) => {
            const currentVideo = {
              id: item.id.videoId,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle,
              thumbnail_url: item.snippet.thumbnails.high.url,
            };

            return currentVideo;
          }
        );

        setSearchedVideos(currentSearchedVideos);
        setshowSearchedVideos(true);
      })
      .catch((error) => {
        console.log(error);
        setShowSearchWarning(true);
        setSearchWarning("*Limite da API estourado!");
      });
  }

  async function addVideosByName(names: string[]) {
    const token = functions.getToken();
    setLoading(true);

    let queue = async.queue((task, callback) => {
      //AIzaSyDYRPz8JUV6JaZtTfuv4A_zNdhAG8io3sc
      api
        .get(
          `https://youtube.googleapis.com/youtube/v3/search?key=AIzaSyDYRPz8JUV6JaZtTfuv4A_zNdhAG8io3sc&type=video&part=snippet&maxResults=1&q=${task} lyrics`
        )
        .then((response) => {
          const searchedVideo: any = response.data.items[0];

          if (searchedVideo) {
            let newUrl =
              "https://www.youtube.com/watch?v=" + searchedVideo.id.videoId;

            api
              .post(
                "/downloads/getInfos",
                {
                  id: searchedVideo.id.videoId,
                },
                {
                  headers: {
                    Authorization: `${token}`,
                  },
                }
              )
              .then((response) => {
                setShowSearchWarning(false);

                const video = {
                  name: functions.removeSpecialCaracteres(
                    searchedVideo.snippet.title
                  ),
                  url: newUrl,
                  embedUrl: functions.getEmbedLink(newUrl),
                };
                const progressingVideo = {
                  name: functions.removeSpecialCaracteres(
                    searchedVideo.snippet.title
                  ),
                  url: newUrl,
                  embedUrl: functions.getEmbedLink(newUrl),
                  status: "waiting",
                  progress: 0,
                };

                setTestProgressingVideosArray(progressingVideo);
                setTestVideosArray(video);

                callback();
              })
              .catch((error: AxiosError) => {
                if (error.response) {
                  const status = error.response.status;
                  const data = error.response.data;

                  if (status === 403) {
                    if (data.message === "Invalid ID") {
                      setShowSearchWarning(true);
                      setSearchWarning("*Insira um link válido!");
                    } else if (data.message === "Invalid Video") {
                      setShowSearchWarning(true);
                      setSearchWarning("*Video inválido!");
                    }
                  } else if (status === 500) {
                    const isTokenValid = data.auth;
                    const errorMessage = data.message;

                    if (isTokenValid === false) {
                      handleLogout(errorMessage);
                    }
                  }
                } else {
                  console.error(error);
                }
              });
          }
        })
        .catch((error) => {
          console.log(error);
          setShowSearchWarning(true);
          setSearchWarning("*Limite da API estourado!");
        });
    }, 2);

    queue.drain(() => {
      setLoading(false);
    });

    names.forEach((name) => {
      queue.push(name);
    });
  }

  async function addVideo(url: string) {
    const token = functions.getToken();
    let playlist_id;

    if (input_link.current) {
      input_link.current.value = "";
    }

    if (url.includes("list=")) {
      if (url.includes("&")) {
        let newUrl = url.split("&");

        if (newUrl[1].includes("list=")) {
          let playlist_header = newUrl[1].split("=");
          playlist_id = playlist_header[1];
        }
      } else {
        let newUrl = url.split("list=");

        playlist_id = newUrl[1];
      }
    } else {
      let newUrl = url.split("&");

      url = newUrl[0];
    }

    if (token) {
      if (playlist_id) {
        if (playlist_id.length > 13) {
          api
            .post(
              "/downloads/getInfosByPlaylist",
              {
                playlistId: playlist_id,
              },
              {
                headers: {
                  Authorization: `${token}`,
                },
              }
            )
            .then((response) => {
              if (response.data === null) {
                setShowSearchWarning(true);
                setSearchWarning("*Não há playlist!");
              } else {
                setShowSearchWarning(false);

                const data = response.data;
                const videos = data.videos;

                addVideos(videos);
              }
            })
            .catch((error: AxiosError) => {
              if (error.response) {
                const isTokenValid = error.response.data.auth;
                const errorMessage = error.response.data.message;

                if (isTokenValid === false) {
                  handleLogout(errorMessage);
                }
              } else {
                console.error(error);
              }
            });
        } else {
          setShowSearchWarning(true);
          setSearchWarning(
            "*Insira uma Playlist válida! Não é permitido links de MIX!"
          );
        }
      } else {
        getInformations(url);
      }
    }
  }

  function getInformations(url: string) {
    const token = functions.getToken();
    let video_id: string = "";

    if (url.includes("https://")) {
      if (url.includes("watch?v")) {
        video_id = url.replace("https://www.youtube.com/watch?v=", "");
      } else if (url.includes("youtu.be")) {
        video_id = url.replace("https://youtu.be/", "");
      }
    } else {
      video_id = url.replace("www.youtube.com/watch?v=", "");
    }

    if (token) {
      api
        .post(
          "/downloads/getInfos",
          {
            id: video_id,
          },
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        )
        .then((response) => {
          const data = response.data;
          const name = data.data.title;

          setShowSearchWarning(false);

          const video = {
            name: functions.removeSpecialCaracteres(name),
            url,
            embedUrl: functions.getEmbedLink(url),
          };

          const progressingVideo = {
            name: functions.removeSpecialCaracteres(name),
            url,
            embedUrl: functions.getEmbedLink(url),
            status: "waiting",
            progress: 0,
          };

          setTestProgressingVideosArray(progressingVideo);
          setTestVideosArray(video);
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 403) {
              if (data.message === "Invalid ID") {
                setShowSearchWarning(true);
                setSearchWarning("*Insira um link válido!");
              } else if (data.message === "Invalid Video") {
                setShowSearchWarning(true);
                setSearchWarning("*Video inválido!");
              }
            } else if (status === 500) {
              const isTokenValid = data.auth;
              const errorMessage = data.message;

              if (isTokenValid === false) {
                handleLogout(errorMessage);
              }
            }
          } else {
            console.error(error);
          }
        });
    }
  }

  function addVideos(linksList: Array<string>) {
    linksList.forEach((link) => {
      addVideo(link);
    });
  }

  function downloadOneVideo(video: VideosInformations) {
    window.location.href = `http://localhost:3333/download?url=${video.url}&name=${video.name}&format=${videoFormat}`;

    const index = downloadedVideosArray.indexOf(video);

    if (index === -1) {
      setDownloadedVideosArray([video, ...downloadedVideosArray]);
    }
  }

  function downloadAllVideos(toDownloadVideos: VideosInformations[]) {
    setShowDownloadWarning(false);

    const thisSessionId = Math.random().toString(36).substr(2, 9);

    const path = videoPath;
    const token = functions.getToken();

    if (path === "") {
      //mostra pro usuário
      setShowDownloadWarning(true);
      setDownloadWarning("*Insira uma pasta de destino!");
      return;
    }

    if (token) {
      //Inicia o socket
      socketEvents(thisSessionId);

      api
        .post(
          `/downloads`,
          {
            videos: toDownloadVideos,
            format: videoFormat,
            downloadPath: path,
            sessionId: thisSessionId,
          },
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        )
        .then((response) => {
          return;
        })
        .catch((error: AxiosError) => {
          if (error.response) {
            const isTokenValid = error.response.data.auth;
            const errorMessage = error.response.data.message;

            if (isTokenValid === false) {
              handleLogout(errorMessage);
            }
          } else {
            setShowDownloadWarning(true);
            setDownloadWarning("*Erro no Download!");
            setShowProgress(false);

            console.error(error);
          }
        });
    }
  }

  function socketEvents(sessionId: string) {
    let contStart = 0;
    let contFinished = 0;

    const socket = io("http://localhost:3333/", { transports: ["websocket"] });
    // const socket = io("https://downfastsystem.herokuapp.com/", { transports : ['websocket'] });
    socket.emit("connectInit", sessionId);

    socket.on("showProgress", ({ msg }) => {
      setShowProgress(true);
    });

    socket.on("noPath", ({ msg }) => {
      setShowDownloadWarning(true);
      setDownloadWarning("*Diretório não encontrado!");
      setShowProgress(false);

      socket.disconnect();
    });

    socket.on("startDownload", ({ msg, index }) => {
      const progressArray = progressingVideosArray;
      progressArray[index].status = "progress"; //progress

      contStart++;
      setProgressingVideosArray([...progressArray]);
    });

    socket.on("progressDownload", ({ percent, index }) => {
      const progressArray = progressingVideosArray;
      progressArray[index].progress = Math.floor(percent);

      setProgressingVideosArray([...progressArray]);
    });

    socket.on("finishedDownload", ({ msg, index }) => {
      const progressArray = progressingVideosArray;
      progressArray[index].status = "finished"; //finished

      contFinished++;
      setProgressingVideosArray([...progressArray]);

      if (contStart === contFinished) {
        const finishVideos = progressingVideosArray;

        finishVideos.forEach((video) => {
          video.status = "finished";
          video.progress = 100;
        });

        setProgressingVideosArray(finishVideos);

        setShowDownloadWarning(true);
        setDownloadWarning("*Download Total Finalizado!");

        socket.disconnect();
      }
    });

    socket.on("errorInDownload", ({ msg, error }) => {
      const allVideos = progressingVideosArray;

      allVideos.forEach((video) => {
        video.status = "error";
        video.progress = 0;
      });

      setShowDownloadWarning(true);
      setDownloadWarning("*Nomes de arquivos inválidos!");

      socket.disconnect();
    });
  }

  function deleteAllVideos() {
    setVideosArray([]);
    setProgressingVideosArray([]);
    setDownloadedVideosArray([]);
    removeAllVideosData();
    setShowProgress(false);
    setShowDownloadWarning(false);
  }

  function createPlaylist() {
    setShowCreatePlaylist(true);
  }

  function showPlaylists() {
    setShowUpdatePlaylist(true);
  }

  function unshowUpdatePopup() {
    setShowUpdatePlaylist(false);
  }

  function deleteLine(index: number) {
    const newArray = [...videosArray];
    newArray.splice(index, 1);

    const newProgressingArray = [...progressingVideosArray];
    newProgressingArray.splice(index, 1);

    // const newDownloadedArray = [...downloadedVideosArray];
    // if(newDownloadedArray[index]) {
    //     newDownloadedArray.splice(index, 1);

    //     setDownloadedVideosArray(newDownloadedArray);
    // }

    setVideosArray(newArray);
    setProgressingVideosArray(newProgressingArray);
    removeOneVideoData(index);
  }

  function addVideosToPlaylist(index: number) {
    const playlist_id = playlistData[index].id;
    const token = functions.getToken();

    if (token) {
      if (videosArray.length > 0) {
        api
          .put(
            `/playlist/${userData.id}/${playlist_id}`,
            {
              updatedVideos: videosArray,
            },
            {
              headers: {
                Authorization: `${token}`,
              },
            }
          )
          .then((response) => {
            alert("Videos adicionados com Sucesso!");
            unshowUpdatePopup();
          })
          .catch((error: AxiosError) => {
            if (error.response) {
              const isTokenValid = error.response.data.auth;
              const errorMessage = error.response.data.message;

              if (isTokenValid === false) {
                handleLogout(errorMessage);
              }
            } else {
              console.error(error);
            }
          });
      } else {
        alert("Esta Playlist não possui vídeos!");
        unshowUpdatePopup();
      }
    }
  }

  function sendFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) {
      return;
    }
    const textFile = event.target.files[0];

    setFile(textFile);
  }

  function updateNamed(newValue: string, position: number) {
    const newArray = [...videosArray];
    const newProgressingArray = [...progressingVideosArray];

    newArray[position].name = newValue;
    newProgressingArray[position].name = newValue;

    addVideosData(newArray);

    setVideosArray(newArray);
    setProgressingVideosArray(newProgressingArray);
  }

  async function getTextByFile() {
    const data = new FormData();
    const token = functions.getToken();

    if (token) {
      if (file) {
        data.append("file", file);
        setFile(undefined);

        api
          .post("/upload", data, {
            headers: {
              Authorization: `${token}`,
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => {
            console.log(response.data);
            const fileList: Array<string> = response.data[0].split("\n");
            console.log(fileList);

            let fileUrls: string[] = [];
            let fileNames: string[] = [];
            let fileNothing: string[] = [];

            fileList.forEach((file: string) => {
              if (
                file.includes("https://www.youtube.com/watch?v=") ||
                file.includes("https://youtu.be/")
              ) {
                fileUrls.push(file);
              } else if (file.length <= 70 && file !== "") {
                fileNames.push(file);
              } else {
                fileNothing.push(file);
              }
            });

            if (fileNothing.length > 1) {
              setShowSearchWarning(true);
              setSearchWarning("*Arquivo no formato Inválido!");
            } else {
              setShowSearchWarning(false);

              if (fileUrls.length > 0) addVideos(fileUrls);
              if (fileNames.length > 0) addVideosByName(fileNames);
            }
          })
          .catch((error: AxiosError) => {
            if (error.response) {
              if (error.response.data.auth) {
                const isTokenValid = error.response.data.auth;
                const errorMessage = error.response.data.message;

                if (isTokenValid === false) {
                  handleLogout(errorMessage);
                }
              }
            } else {
              setShowSearchWarning(true);
              setSearchWarning("*Arquivo modificado recentemente!");
            }
          });
      }
    }
  }

  function addSearchedVideo(video: videosSearchProps) {
    if (video) {
      const url = "https://www.youtube.com/watch?v=" + video.id;

      getInformations(url);
    }
  }

  return (
    <div
      id="home-landing"
      style={loading ? { cursor: "progress" } : { cursor: "default" }}
    >
      <Navbar page={1} page_title={"Home"} />

      {showHelpPopup && (
        <div id="show-terms-popup">
          <div id="overlay" onClick={() => setShowHelpPopup(false)}></div>

          <div id="show-help-container">
            <h2>Formato do Arquivo</h2>

            <div id="help-informations">
              <p>
                {" "}
                <strong>1.</strong> O arquivo deve ser um bloco de notas;
              </p>
              <p>
                {" "}
                <strong>2.</strong> O site aceita tanto <strong>LINKS</strong>{" "}
                quanto <strong>NOMES</strong> para pesquisa;
              </p>
              <p>
                {" "}
                <strong>3.</strong> Deve ser escrito um{" "}
                <strong>LINK/NOME</strong> por linha;
              </p>
              <p>
                {" "}
                <strong>4.</strong> Não podem haver linhas em branco;
              </p>
              <p>
                {" "}
                <strong>5.</strong> Exemplo na imagem abaixo:
              </p>

              <img src={blocoNotas} alt="Exemplo Bloco de Notas" />
            </div>
          </div>
        </div>
      )}

      {showCreatePlaylist && (
        <CreatePlaylistBox
          videos={videosArray}
          setCreatePlaylistWindow={setShowCreatePlaylist}
          previousPage={"Home"}
        ></CreatePlaylistBox>
      )}

      {showSearchedVideos && (
        <div id="searched-list-container">
          <div id="overlay" onClick={() => setshowSearchedVideos(false)}></div>
          <div id="searched-list-popup">
            <h2 title={`Lista de Vídeos (${videoLink})`}>
              Lista de Vídeos ({videoLink})
            </h2>

            <div id="searched-list-box">
              {searchedVideos.map((video, index) => {
                return (
                  <div className="each-search" key={index}>
                    <img src={video.thumbnail_url} alt="" />
                    <div className="search-infos">
                      <div className="search-infos-title">
                        <h3 title={video.title}>{video.title}</h3>
                        <span title={video.channelTitle}>
                          {video.channelTitle}
                        </span>
                      </div>
                    </div>

                    <button
                      className="pick-video"
                      onClick={() => addSearchedVideo(video)}
                    >
                      {" "}
                      +{" "}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              id="close-popup"
              onClick={() => setshowSearchedVideos(false)}
            >
              <AiIcons.AiOutlineClose color="red" />
            </button>
          </div>
        </div>
      )}

      {showupdatePlaylist && (
        <div id="playlists-list-container">
          <div id="overlay" onClick={unshowUpdatePopup}></div>
          <div id="playlists-list-popup">
            <h2>Seleciona sua Playlist</h2>

            <div id="playlists-list-box">
              {playlistData.map((playlist, index) => {
                return (
                  <div className="each-playlist" key={index}>
                    <div className="each-playlist-infos">
                      <h3 title={playlist.title}>{playlist.title}</h3>
                      <span title={playlist.genre}>{playlist.genre}</span>
                    </div>
                    <div className="add-to-playlist-button">
                      <button onClick={() => addVideosToPlaylist(index)}>
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="home-container">
        <div id="input-container">
          <h2>Baixe vídeos do Youtube</h2>

          {setVideos ? (
            <div id="search-container">
              <input
                type="text"
                ref={input_link}
                id="input-link"
                placeholder={
                  urlOrName === "url"
                    ? "Insira o link de um vídeo ou playlist aqui"
                    : "Insira o nome de um vídeo para pesquisa aqui"
                }
                onChange={(e) => setVideoLink(e.target.value)}
              />
              {/* <button type="button" onClick={() => addVideo(videoLink)}>Enviar</button> */}
              <button
                type="button"
                onClick={
                  urlOrName === "url"
                    ? () => addVideo(videoLink)
                    : () => searchByName(videoLink)
                }
              >
                Enviar
              </button>

              <button
                className="change-button"
                type="button"
                onClick={() => setSetVideos(false)}
              >
                Inserir Arquivo
              </button>

              <span
                style={
                  showSearchWarning
                    ? { visibility: "visible" }
                    : { visibility: "hidden" }
                }
                className="warning-search"
              >
                {searchWarning}
              </span>

              <div id="search-item-radio">
                <input
                  type="radio"
                  defaultChecked
                  id="url"
                  name="search-item"
                  value="url"
                  onClick={(e) => setUrlOrName("url")}
                />
                <label htmlFor="url">Urls</label>
                <input
                  type="radio"
                  id="name"
                  name="search-item"
                  value="name"
                  onClick={(e) => setUrlOrName("name")}
                />
                <label htmlFor="name">Nomes</label>
              </div>
            </div>
          ) : (
            <div id="file-container">
              <label
                htmlFor="file-input"
                id="file-label"
                style={
                  file
                    ? { borderColor: "orange", color: "orange" }
                    : {
                        borderColor: "var(--color-secondary)",
                        color: "var(--color-secondary)",
                      }
                }
              >
                {file ? "Arquivo Recebido" : "Enviar Arquivo de Texto"}
              </label>
              <input
                type="file"
                name="arquivo-file"
                id="file-input"
                accept="text/plain"
                onChange={sendFile}
              />

              <button type="button" onClick={getTextByFile}>
                Enviar
              </button>

              <button
                className="change-button"
                type="button"
                onClick={() => setSetVideos(true)}
              >
                Inserir Nomes
              </button>

              <span
                style={
                  showSearchWarning
                    ? { visibility: "visible" }
                    : { visibility: "hidden" }
                }
                className="warning-search"
              >
                {searchWarning}
              </span>

              <button id="open-help" onClick={() => setShowHelpPopup(true)}>
                <AiIcons.AiFillInfoCircle id="help-icon" />
              </button>
            </div>
          )}
        </div>

        <div
          id="boxes-container"
          className={videosArray.length > 0 ? "" : "hidden"}
        >
          <div id="waiting-musics">
            <div className="box-title">
              <h2>Fila de Espera ({videosArray.length})</h2>
            </div>
            <div className="box-content">
              {videosArray.map((item, index) => {
                return (
                  <div className="box-line" key={index}>
                    <div className="box-line-start">
                      {videoFormat === "mp4" ? (
                        <BsIcons.BsCameraVideoFill fontSize=".9em" />
                      ) : (
                        <BsIcons.BsMusicNoteBeamed fontSize=".9em" />
                      )}
                      <input
                        value={item.name}
                        title={item.name}
                        onChange={(e) => updateNamed(e.target.value, index)}
                      />
                    </div>

                    <div className="box-line-end">
                      <button onClick={() => downloadOneVideo(item)}>
                        <HiIcons.HiOutlineDownload color="black" />
                      </button>

                      <button onClick={() => deleteLine(index)}>
                        <BsIcons.BsFillTrashFill color="#7a0b0b" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div id="box-buttons">
              <button id="create-playlist" onClick={createPlaylist}>
                <GrIcons.GrFormAdd color="black" />
                <span>Nova Playlist</span>
              </button>
              <button id="add-playlist" onClick={showPlaylists}>
                <GrIcons.GrFormAdd color="black" />
                <span>Adicionar à Playlist</span>
              </button>
              <button id="remove-all-videos" onClick={deleteAllVideos}>
                <BsIcons.BsFillTrashFill color="black" />
                <span>Remover</span>
              </button>
            </div>
          </div>

          <div id="configurations">
            <div id="configurations-select">
              <label htmlFor="format">Formato</label>
              <select
                name="format"
                id="format-select"
                onChange={(e) => {
                  setVideoFormat(e.target.value);
                }}
              >
                <option value="mp4">MP4</option>
                <option value="mp3">MP3</option>
              </select>
            </div>

            <div id="diretory-pick">
              <label htmlFor="">Pasta de Destino</label>
              <span>(Ex.: D:\Meus_Documentos\Músicas)</span>
              <input
                type="text"
                placeholder="Insira o caminho"
                onChange={(e) => setVideoPath(e.target.value)}
              />
            </div>

            <button
              id="download-all-videos"
              onClick={() => downloadAllVideos(videosArray)}
            >
              Baixar Vídeos
            </button>

            <span
              style={
                showDownloadWarning
                  ? { visibility: "visible" }
                  : { visibility: "hidden" }
              }
              className="warning-download"
            >
              {downloadWarning}
            </span>
          </div>

          <div id="downloaded-musics">
            <div className="box-title">
              <h2>Downloads</h2>
            </div>

            {showProgress === true ? (
              <div className="box-content">
                {progressingVideosArray.map((item, index) => {
                  return (
                    <div className="box-line" key={index}>
                      <div className="box-line-start">
                        <p title={item.name}>{item.name}</p>
                      </div>

                      <div className="progress-bar">
                        <span>{`${item.progress}%`}</span>

                        <div className="total-progress-bar">
                          <div
                            className="current-progress-bar"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>

                        <div className="current-status">
                          {item.status === "waiting" && (
                            <MdIcons.MdHourglassEmpty size={15} color="red" />
                          )}
                          {item.status === "finished" && (
                            <MdIcons.MdDone size={15} color="green" />
                          )}
                          {item.status === "progress" && (
                            <MdIcons.MdFileDownload size={15} color="blue" />
                          )}
                          {item.status === "error" && (
                            <AiIcons.AiOutlineExclamation
                              size={15}
                              color="red"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="box-content"></div>
            )}
            {/* { downloadedVideosArray ?
                            <div className="box-content">
                            {downloadedVideosArray.map((item, index) => {
                                return(
                                    <div className="box-line" key={index}>
                                        <div className="box-line-start">
                                            <p title={item.name} >{item.name}</p>
                                        </div>

                                        <div className="progress-bar">
                                            <div className="current-status">
                                                <MdIcons.MdDone size={15} color='green' />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
                        :
                            <div className="box-content"></div>
                        } */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
