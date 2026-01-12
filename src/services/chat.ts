import type { ChatDetailResponse } from '../types/chat/ChatDetail';
import type { ApiResponse } from '../types/api';

const API_BASE = 'http://localhost:8081';

export async function fetchChatDetail(chatRoomId: number): Promise<ChatDetailResponse> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }

  const url = `${API_BASE}/api/chats/${chatRoomId}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  const text = await res.text();
  let apiResponse: ApiResponse<ChatDetailResponse>;
  
  try {
    apiResponse = text ? JSON.parse(text) : { success: false };
  } catch {
    throw new Error('서버 응답 데이터 형식이 올바르지 않습니다.');
  }
  
  if (!res.ok || !apiResponse.success) {
    throw new Error(apiResponse.message || '채팅방 정보를 불러오는데 실패했습니다.');
  }
  
  if (!apiResponse.data) {
    throw new Error('채팅방 데이터가 없습니다.');
  }
  
  return apiResponse.data;
}

export async function patchChatReaction(
  chatRoomId: number,
  reactionType: 'LIKE' | 'DISLIKE'
): Promise<{ chatRoomId: number; likeCnt: number; dislikeCnt: number }> {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('인증이 필요합니다.');
  }

  const res = await fetch(`${API_BASE}/api/chats/${chatRoomId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reactionType }),
  });

  const text = await res.text();
  const apiResponse: ApiResponse<any> = text ? JSON.parse(text) : {};

  if (!res.ok || !apiResponse.success) {
    throw new Error(apiResponse.message || '공감 처리에 실패했습니다.');
  }

  return apiResponse.data;
}
