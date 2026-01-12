import type { LoginRequestDto, SignupRequestDto } from "../types/auth/request";
import type { SignupResponseDto, LoginResponseDto } from "../types/auth/response";
import type { ApiResponse } from "../types/api";

const API_BASE = 'http://localhost:8081';

export async function login(request: LoginRequestDto): Promise<LoginResponseDto> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const text = await res.text();
  let result: ApiResponse<LoginResponseDto> | undefined;
  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }
  if (!res.ok || !result.success) {
    throw new Error(result.message || '로그인에 실패했습니다.');
  }
  if (!result.data?.refreshToken || !result.data?.accessToken) {
    throw new Error('토큰이 올바르게 반환되지 않았습니다.');
  }
  return result.data;
}

export async function signup(request: SignupRequestDto): Promise<SignupResponseDto> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const text = await res.text();
  let result: ApiResponse<SignupResponseDto> | undefined;
  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }
  if (!res.ok || !result.success) {
    throw new Error(result.message || '회원가입에 실패했습니다.');
  }
  if (!result.data?.userId) {
    throw new Error('회원 ID가 올바르게 반환되지 않았습니다.');
  }
  return result.data;
}

export async function logout(refreshToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const text = await res.text();
  let result: ApiResponse<any> | undefined;
  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }
  if (!res.ok || !result.success) {
    throw new Error(result.message || '로그아웃에 실패했습니다.');
  }
}

export async function withdraw(userId: number, refreshToken: string): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }
  const res = await fetch(`${API_BASE}/api/auth/${userId}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
  const text = await res.text();
  let result: ApiResponse<any> | undefined;
  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }
  if (!res.ok || !result.success) {
    throw new Error(result.message || '회원 탈퇴에 실패했습니다.');
  }
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }
  const res = await fetch(`${API_BASE}/api/admin/password/${userId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ newPassword }),
  });
  const text = await res.text();
  let result: ApiResponse<any> | undefined;
  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }
  if (!res.ok || !result.success) {
    throw new Error(result.message || '비밀번호 변경에 실패했습니다.');
  }
}

export async function updateUserInfo(userId: number, email: string, name: string, studentNum: number): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }
  const res = await fetch(`${API_BASE}/api/admin/${userId}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, name, studentNum }),
  });
  const text = await res.text();
  let result: ApiResponse<any> | undefined;
  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }
  if (!res.ok || !result.success) {
    throw new Error(result.message || '회원 정보 수정에 실패했습니다.');
  }
}