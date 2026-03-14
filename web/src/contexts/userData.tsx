import {createContext, FC, useEffect, useState} from 'react';

interface UserProps {
    id: string,
    email: string,
    name: string,
    username: string
    likedsPlaylists: Array<string>;
    role: string;
}

interface PlaylistVideosProps {
    name: string;
    url: string;
}

interface PlaylistProps {
    id: string;
    title: string;
    genre: string;
    likes: number;
    security: string;
    keywords: Array<string>;
    videos: Array<PlaylistVideosProps>;
}

interface userContextProps {
    userData: UserProps
    playlistData: PlaylistProps[]
    videosData: PlaylistVideosProps[]
    addPlaylistData: (data: PlaylistProps[]) => void
    addUserData: (data: UserProps) => void;
    addVideosData: (data: PlaylistVideosProps[]) => void
    addVideoData: (data: PlaylistVideosProps) => void
    removeAllVideosData: () => void
    removeOneVideoData: (index: number) => void
}

export const userContextDefaultValueProps: userContextProps = {
    userData: {
        id: '',
        email: '',
        name: '',
        username: '',
        likedsPlaylists: [''],
        role: ''
    },
    playlistData: [{
        id: '',
        title: '',
        genre: '',
        likes: 0,
        security: '',
        keywords: [''],
        videos: [{
            name: '',
            url: ''
        }],
    }],
    videosData: [{
        name: '',
        url: ''
    }],
    addVideosData: () => {},
    addPlaylistData: () => {},
    addUserData: () => {},
    addVideoData: () => {},
    removeAllVideosData: () => {},
    removeOneVideoData: () => {}
}

export const UserContext = createContext<userContextProps>( userContextDefaultValueProps );

export const UserProvider: FC = ({ children }) => {
    const [userData, setUserData] = useState<UserProps>(userContextDefaultValueProps.userData);
    const [playlistData, setPlaylistData] = useState<PlaylistProps[]>(userContextDefaultValueProps.playlistData);
    const [videosData, setVideosData] = useState<PlaylistVideosProps[]>([]);

    useEffect(() => {
        const userStorage = localStorage.getItem('user');
        const playlistStorage = localStorage.getItem('playlists');
        const videosStorage = localStorage.getItem('videos');

        if(userStorage) {
            setUserData(JSON.parse(userStorage));
        }
        if(playlistStorage) {
            setPlaylistData(JSON.parse(playlistStorage));
        }
        if(videosStorage) {
            setVideosData(JSON.parse(videosStorage));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('videos', JSON.stringify(videosData));
    }, [videosData]);

    const addUserData = (data: UserProps) => {
        setUserData(data);

        localStorage.setItem('user', JSON.stringify(data));
    }

    const addPlaylistData = (data: PlaylistProps[]) => {
        setPlaylistData(data);

        localStorage.setItem('playlists', JSON.stringify(data));
    }

    const addVideosData = (data: PlaylistVideosProps[]) => {
        setVideosData(data);

        localStorage.setItem('videos', JSON.stringify(data));
    }

    const addVideoData = (data: PlaylistVideosProps) => {
        setVideosData([...videosData, data]);

        localStorage.setItem('videos', JSON.stringify([...videosData]));
    }

    const removeAllVideosData = () => {
        setVideosData([]);
    }

    const removeOneVideoData = (index: number) => {
        const newArray = [...videosData];
        newArray.splice(index, 1);

        setVideosData(newArray);
    }

    return(
        <UserContext.Provider value={
            {userData, addUserData, 
            playlistData, addPlaylistData, 
            videosData, addVideosData, addVideoData, removeAllVideosData, removeOneVideoData}
        }>
            {children}
        </UserContext.Provider>
    );
}