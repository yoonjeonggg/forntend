export interface ChatMessage {
  message: string;
  isDeleted: boolean;
  sender: number;
  senderName: string;
  createdAt: string; // ISO DateTime string
}

export interface ChatDetailResponse {
  chatRoomId: number;
  likeCnt: number;
  dislikeCnt: number;
  title: string;
  tag: string;
  items: ChatMessage[];
  createdAt: string; // ISO DateTime string
}
