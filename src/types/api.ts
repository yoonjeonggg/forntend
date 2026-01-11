// 공통 API 응답 (ApiResponse)
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
}