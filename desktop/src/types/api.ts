// --- Shared domain types ---

export interface UserProps {
  id: string;
  email: string;
  name: string;
  username: string;
  likedsPlaylists: string[];
  role: string;
}

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
  keywords: string[];
  videos: PlaylistVideosProps[];
}

export interface VideosInformations {
  name: string;
  url: string;
  embedUrl: string;
}

// --- Auth ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserProps;
}

export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
}

export interface SendMailRequest {
  email: string;
}

export interface AuthErrorResponse {
  auth: false;
  message: string;
}

// --- Users ---

export interface UpdateUserRequest {
  updatedUser: UserProps;
}

export interface ChangePasswordRequest {
  actualPassword: string;
  newPassword: string;
}

export interface ChangePasswordErrorResponse {
  error: string;
}

export interface UserErrorResponse {
  error: string;
}

// --- Downloads ---

export interface DownloadErrorResponse {
  message: string;
}

// --- Playlists ---

export interface CreatePlaylistRequest {
  title: string;
  genre: string;
  security: string;
  likes: number;
  videos: PlaylistVideosProps[];
  keywords: string[];
  user_id: string;
}

export interface UpdatePlaylistRequest {
  updatedPlaylist: PlaylistProps;
}

export interface AddVideosToPlaylistRequest {
  updatedVideos: VideosInformations[];
}
