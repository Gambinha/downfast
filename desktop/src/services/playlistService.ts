import api from './api';
import type {
  PlaylistProps,
  CreatePlaylistRequest,
  UpdatePlaylistRequest,
  AddVideosToPlaylistRequest,
} from '../types/api';

export async function getPlaylists(userId: string): Promise<PlaylistProps[]> {
  const response = await api.get<PlaylistProps[]>(`/playlist/${userId}`);
  return response.data;
}

export async function createPlaylist(data: CreatePlaylistRequest): Promise<void> {
  await api.post('/playlist', data);
}

export async function updatePlaylist(data: UpdatePlaylistRequest): Promise<void> {
  await api.put('/playlist', data);
}

export async function addVideosToPlaylist(
  userId: string,
  playlistId: string,
  data: AddVideosToPlaylistRequest,
): Promise<void> {
  await api.put(`/playlist/${userId}/${playlistId}`, data);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  await api.delete(`/playlist/${playlistId}`);
}
