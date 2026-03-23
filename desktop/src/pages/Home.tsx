import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import * as AiIcons from "react-icons/ai";
import * as BsIcons from "react-icons/bs";
import * as GrIcons from "react-icons/gr";
import * as HiIcons from "react-icons/hi";
import * as MdIcons from "react-icons/md";

import "../styles/pages/home.css";

import CreatePlaylistBox from "../components/CreatePlaylistBox";
import Navbar from "../components/Navbar";

import { useDownload, type DownloadEvent } from "../hooks/useDownload";
import { useFolderDialog } from "../hooks/useFolderDialog";
import { useYoutube } from "../hooks/useYoutube";

import { UserContext } from "../contexts/userData";

import { sendNotification } from "@tauri-apps/plugin-notification";

import { verifyToken } from "../services/authService";
import { addVideosToPlaylist as addVideosToPlaylistService } from "../services/playlistService";
import { uploadFile } from "../services/uploadService";

import type { VideosInformations } from "../types/api";

interface ProgressingVideosInformations {
  name: string;
  url: string;
  embedUrl: string;
  status: string;
  progress: number;
}

interface VideosSearchProps {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail_url: string;
}

function Home() {
  const { pickFolder } = useFolderDialog();
  const youtube = useYoutube();

  const [searchWarning, setSearchWarning] = useState("Teste");
  const [showSearchWarning, setShowSearchWarning] = useState(false);
  const [downloadWarning, setDownloadWarning] = useState("Teste");
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);

  const {
    userData,
    playlistData,
    addVideoData,
    addVideosData,
    removeAllVideosData,
    removeOneVideoData,
  } = useContext(UserContext);

  const [videosArray, setVideosArray] = useState<VideosInformations[]>([]);
  const [progressingVideosArray, setProgressingVideosArray] = useState<
    ProgressingVideosInformations[]
  >([]);
  const progressRef = useRef<ProgressingVideosInformations[]>([]);
  const flushScheduledRef = useRef(false);
  const totalVideosRef = useRef(0);

  const [searchedVideos, setSearchedVideos] = useState<VideosSearchProps[]>([]);

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

  const [setVideos, setSetVideos] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifyToken().catch(() => {
      // Auth errors handled by interceptor
    });

    const videosStorage = localStorage.getItem("videos");

    if (videosStorage) {
      if (videosStorage.length > 0) {
        const allVideos = JSON.parse(videosStorage);

        const progressVideos = allVideos.map((video: VideosInformations) => {
          return {
            name: video.name,
            url: video.url,
            status: "waiting",
            progress: 0,
          };
        });

        setVideosArray(allVideos);
        setProgressingVideosArray(progressVideos);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    progressRef.current = progressingVideosArray;
  }, [progressingVideosArray]);

  async function searchByName(name: string) {
    setShowSearchWarning(false);

    try {
      const results = await youtube.searchVideos(name, 6);
      const currentSearchedVideos = results.map((item) => ({
        id: item.video_id,
        title: item.title,
        channelTitle: item.channel,
        thumbnail_url: item.thumbnail,
      }));

      setSearchedVideos(currentSearchedVideos);
      setshowSearchedVideos(true);
    } catch (error) {
      console.log(error);
      setShowSearchWarning(true);
      setSearchWarning("*Erro ao buscar vídeos.");
    }
  }

  async function addVideosByName(names: string[]) {
    setLoading(true);

    for (const task of names) {
      try {
        const results = await youtube.searchVideos(task + " lyrics", 1);
        const searchedVideo = results[0];

        if (searchedVideo) {
          try {
            const info = await youtube.getVideoInfo(searchedVideo.video_id);
            setShowSearchWarning(false);

            const video: VideosInformations = {
              name: info.name,
              url: info.url,
              embedUrl: info.embedUrl,
            };
            const progressingVideo: ProgressingVideosInformations = {
              ...video,
              status: "waiting",
              progress: 0,
            };

            setVideosArray((prev) => [...prev, video]);
            setProgressingVideosArray((prev) => [...prev, progressingVideo]);
            addVideoData(video);
          } catch (error) {
            console.error(error);
            setShowSearchWarning(true);
            setSearchWarning("*Video inválido!");
          }
        }
      } catch (error) {
        console.log(error);
        setShowSearchWarning(true);
        setSearchWarning("*Erro ao buscar vídeos.");
      }
    }

    setLoading(false);
  }

  async function addVideo(url: string) {
    if (input_link.current) input_link.current.value = "";

    try {
      const response = await youtube.resolveUrl(url);
      setShowSearchWarning(false);
      response.videos.forEach((video: VideosInformations) => {
        setVideosArray((prev) => [...prev, video]);
        setProgressingVideosArray((prev) => [
          ...prev,
          { ...video, status: "waiting", progress: 0 },
        ]);
        addVideoData(video);
      });
    } catch (error) {
      console.error(error);
      setShowSearchWarning(true);
      setSearchWarning("*Link inválido ou vídeo não encontrado!");
    }
  }

  function addVideos(linksList: Array<string>) {
    linksList.forEach((link) => {
      addVideo(link);
    });
  }

  const finishedCountRef = useRef(0);

  const handleDownloadEvent = useCallback((event: DownloadEvent) => {
    const { index, percent, status, message } = event;

    switch (status) {
      case "start":
        if (progressRef.current[index]) {
          progressRef.current[index].status = "progress";
          scheduleFlush();
        }
        break;
      case "progress":
        if (progressRef.current[index]) {
          progressRef.current[index].progress = Math.floor(percent);
          scheduleFlush();
        }
        break;
      case "finished":
        if (progressRef.current[index]) {
          progressRef.current[index].status = "finished";
          progressRef.current[index].progress = 100;
          finishedCountRef.current++;

          if (finishedCountRef.current === totalVideosRef.current) {
            setProgressingVideosArray([...progressRef.current]);
            setShowDownloadWarning(true);
            setDownloadWarning("*Download Total Finalizado!");
            sendNotification({
              title: "DownFast",
              body: "Downloads concluídos!",
            });
          } else {
            scheduleFlush();
          }
        }
        break;
      case "error":
        if (progressRef.current[index]) {
          progressRef.current[index].status = "error";
          progressRef.current[index].progress = 0;
          scheduleFlush();
          console.error(`Download error (index ${index}):`, message);
        }
        break;
    }
  }, []);

  const { startDownload: invokeDownload, cancelAllDownloads } =
    useDownload(handleDownloadEvent);

  async function downloadOneVideo(video: VideosInformations) {
    const path = videoPath;
    if (path === "") {
      setShowDownloadWarning(true);
      setDownloadWarning("*Insira uma pasta de destino!");
      return;
    }

    totalVideosRef.current = 1;
    finishedCountRef.current = 0;

    const progressVideo = {
      ...video,
      status: "waiting",
      progress: 0,
    };
    progressRef.current = [progressVideo];
    setProgressingVideosArray([progressVideo]);
    setShowProgress(true);
    setShowDownloadWarning(false);

    try {
      await invokeDownload({
        videos: [{ name: video.name, url: video.url }],
        format: videoFormat,
        download_path: path,
      });
    } catch (error) {
      console.error(error);
      setShowDownloadWarning(true);
      setDownloadWarning("*Erro no Download!");
      setShowProgress(false);
    }

    const index = downloadedVideosArray.indexOf(video);
    if (index === -1) {
      setDownloadedVideosArray([video, ...downloadedVideosArray]);
    }
  }

  async function downloadAllVideos(toDownloadVideos: VideosInformations[]) {
    setShowDownloadWarning(false);

    const path = videoPath;

    if (path === "") {
      setShowDownloadWarning(true);
      setDownloadWarning("*Insira uma pasta de destino!");
      return;
    }

    totalVideosRef.current = toDownloadVideos.length;
    finishedCountRef.current = 0;
    setShowProgress(true);

    try {
      await invokeDownload({
        videos: toDownloadVideos.map((v) => ({ name: v.name, url: v.url })),
        format: videoFormat,
        download_path: path,
      });
    } catch (error) {
      console.error(error);
      setShowDownloadWarning(true);
      setDownloadWarning("*Erro no Download!");
      setShowProgress(false);
    }
  }

  function scheduleFlush() {
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    requestAnimationFrame(() => {
      flushScheduledRef.current = false;
      setProgressingVideosArray([...progressRef.current]);
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

    setVideosArray(newArray);
    setProgressingVideosArray(newProgressingArray);
    removeOneVideoData(index);
  }

  async function handleAddVideosToPlaylist(index: number) {
    const playlist_id = playlistData[index].id;

    if (videosArray.length > 0) {
      try {
        await addVideosToPlaylistService(userData.id, playlist_id, {
          updatedVideos: videosArray,
        });
        alert("Videos adicionados com Sucesso!");
        unshowUpdatePopup();
      } catch {
        // Auth errors handled by interceptor
      }
    } else {
      alert("Esta Playlist não possui vídeos!");
      unshowUpdatePopup();
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
    if (!file) return;

    try {
      const fileList = await uploadFile(file);
      setFile(undefined);

      let fileUrls: string[] = [];
      let fileNames: string[] = [];
      let fileNothing: string[] = [];

      fileList.forEach((fileLine: string) => {
        if (
          fileLine.includes("https://www.youtube.com/watch?v=") ||
          fileLine.includes("https://music.youtube.com/watch?v=") ||
          fileLine.includes("https://youtu.be/")
        ) {
          fileUrls.push(fileLine);
        } else if (fileLine !== "") {
          fileNames.push(fileLine);
        } else {
          fileNothing.push(fileLine);
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
    } catch {
      setShowSearchWarning(true);
      setSearchWarning("*Arquivo modificado recentemente!");
    }
  }

  function addSearchedVideo(video: VideosSearchProps) {
    if (video) {
      const url = "https://www.youtube.com/watch?v=" + video.id;
      addVideo(url);
    }
  }

  async function handlePickFolder() {
    const folder = await pickFolder();
    if (folder) {
      setVideoPath(folder);
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
                <strong>1.</strong> O arquivo deve ser um bloco de notas;
              </p>
              <p>
                <strong>2.</strong> O site aceita tanto <strong>LINKS</strong>{" "}
                quanto <strong>NOMES</strong> para pesquisa;
              </p>
              <p>
                <strong>3.</strong> Deve ser escrito um{" "}
                <strong>LINK/NOME</strong> por linha;
              </p>
              <p>
                <strong>4.</strong> Não podem haver linhas em branco;
              </p>
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
                      +
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
                      <button onClick={() => handleAddVideosToPlaylist(index)}>
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
                  onClick={() => setUrlOrName("url")}
                />
                <label htmlFor="url">Urls</label>
                <input
                  type="radio"
                  id="name"
                  name="search-item"
                  value="name"
                  onClick={() => setUrlOrName("name")}
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
                onChange={(e) => setVideoFormat(e.target.value)}
              >
                <option value="mp4">MP4</option>
                <option value="mp3">MP3</option>
              </select>
            </div>

            <div id="diretory-pick">
              <label>Pasta de Destino</label>
              <span id="selected-path">
                {videoPath || "Nenhuma pasta selecionada"}
              </span>
              <button
                id="pick-folder-button"
                type="button"
                onClick={handlePickFolder}
              >
                Escolher Pasta
              </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
