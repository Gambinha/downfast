import api from './api';
import type { UpdateUserRequest, ChangePasswordRequest } from '../types/api';

export async function updateUser(data: UpdateUserRequest): Promise<void> {
  await api.put('/users', data);
}

export async function changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
  await api.put(`/users/password/${userId}`, data);
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
}
