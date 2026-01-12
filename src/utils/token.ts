export const getUserIdFromToken = (token: string): number | string | null => {
    try {
      // 1. 토큰의 중간 부분(Payload)을 추출합니다.
      const base64Url = token.split('.')[1];
      // 2. Base64 형식을 디코딩하기 위해 형식을 맞춥니다.
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // 3. JSON 문자열로 변환 후 객체로 파싱합니다.
      const payload = JSON.parse(window.atob(base64));
  
      // 백엔드에서 설정한 키 값을 확인해야 합니다 (보통 'userId' 또는 'sub')
      console.log('Token Payload:', payload); 
      return payload.userId || payload.sub || null;
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
      return null;
    }
  };