import api from './api';

export async function uploadFile(file: File): Promise<string[]> {
  const data = new FormData();
  data.append('file', file);
  const response = await api.post<string[]>('/upload', data);
  return response.data;
}
