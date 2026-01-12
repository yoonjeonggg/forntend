import type { ApiResponse } from '../types/api';

const API_BASE = 'http://localhost:8081';

export interface StudentInfo {
  userId: number;
  studentNum: number;
  email: string;
  name: string;
}

/* =========================
   전체 학생 조회
========================= */
export async function getAllUsers(): Promise<StudentInfo[]> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }

  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await res.text();
  let result: ApiResponse<StudentInfo[]> | undefined;

  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }

  if (!result) {
    throw new Error('서버에서 데이터를 반환하지 않았습니다.');
  }

  if (!res.ok || !result.success) {
    throw new Error(result.message || '학생 정보 조회에 실패했습니다.');
  }

  if (!result.data || !Array.isArray(result.data)) {
    return [];
  }

  return result.data;
}

/* =========================
   특정 학생 조회 (수정 페이지)
========================= */
export async function getUserById(userId: number): Promise<StudentInfo> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }

  const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await res.text();
  let result: ApiResponse<StudentInfo> | undefined;

  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }

  if (!result || !res.ok || !result.success || !result.data) {
    throw new Error(result?.message || '회원 정보를 불러올 수 없습니다.');
  }

  return result.data;
}

/* =========================
   관리자 회원 수정 (비밀번호 변경)
========================= */
export async function updateAdminUser(
  userId: number,
  payload: {
    email: string;
    name: string;
    studentNum: number;
    newPassword: string;
  }
): Promise<void> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }

  const res = await fetch(`${API_BASE}/api/admin/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let result: ApiResponse<null> | undefined;

  try {
    result = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }

  if (!result || !res.ok || !result.success) {
    throw new Error(result?.message || '회원 정보 수정에 실패했습니다.');
  }
}
