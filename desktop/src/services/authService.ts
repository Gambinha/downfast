import api from './api';
import type { LoginRequest, LoginResponse, RegisterRequest, SendMailRequest } from '../types/api';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/session', data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<void> {
  await api.post('/users', data);
}

export async function verifyToken(): Promise<void> {
  await api.get('/verify');
}

export async function sendMail(data: SendMailRequest): Promise<void> {
  await api.post('/sendMail', data);
}
