import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import { useAuth } from '../contexts/AuthContext';
import { logout as logoutService, withdraw, updateUserInfo, getUserInfo } from '../services/auth';
import './UserProfile.css';

// JWT 파싱 헬퍼 함수
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function UserProfile() {
  const navigate = useNavigate();
  const { isLoggedIn, userName, userId, userEmail, studentNum, logout, updateUserInfo: updateContext } = useAuth();
  const [editingField, setEditingField] = useState<'studentNum' | 'name' | 'email' | null>(null);
  const [profileData, setProfileData] = useState({
    studentNum: '',
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!isLoggedIn) {
        navigate('/login');
        return;
      }

      setLoadingProfile(true);
      try {
        // API에서 사용자 정보 가져오기 (현재 로그인한 사용자)
        const userInfo = await getUserInfo();
        setProfileData({
          studentNum: (userInfo.studentNum?.toString() || ''),
          name: userInfo.name || '',
          email: userInfo.email || '',
        });
        // Context도 업데이트 (userId 포함)
        if (userInfo.userId) {
          // userId가 있으면 context에 저장 (다른 곳에서 사용할 수 있도록)
        }
        if (userInfo.studentNum) {
          updateContext(userInfo.name, userInfo.email, userInfo.studentNum);
        } else {
          // studentNum이 없으면 이름과 이메일만 업데이트
          updateContext(userInfo.name, userInfo.email, studentNum || 0);
        }
      } catch (err: any) {
        // API 실패 시 JWT에서 가져온 값 사용
        setProfileData({
          studentNum: (studentNum?.toString() || ''),
          name: (userName || ''),
          email: (userEmail || ''),
        });
        console.error('사용자 정보 조회 실패:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserInfo();
  }, [isLoggedIn, userId, navigate]);

  const handleEdit = (field: 'studentNum' | 'name' | 'email') => {
    setEditingField(field);
    setError(null);
  };

  const handleSave = async (field: 'studentNum' | 'name' | 'email') => {
    if (!userId || typeof userId !== 'number') {
      setError('사용자 ID를 찾을 수 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newStudentNum = field === 'studentNum' ? Number(profileData.studentNum) : (studentNum || Number(profileData.studentNum) || 0);
      const newName = field === 'name' ? profileData.name : (userName || profileData.name);
      const newEmail = field === 'email' ? profileData.email : (userEmail || profileData.email);

      // API 호출 및 응답 데이터 받기
      const updatedData = await updateUserInfo(userId, newEmail, newName, newStudentNum);
      
      // 응답 데이터로 context 업데이트
      updateContext(updatedData.name, updatedData.email, updatedData.studentNum);
      
      // 로컬 상태도 업데이트
      setProfileData({
        studentNum: updatedData.studentNum.toString(),
        name: updatedData.name,
        email: updatedData.email,
      });
      
      setEditingField(null);
    } catch (err: any) {
      setError(err.message || '정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (field: 'studentNum' | 'name' | 'email') => {
    setEditingField(null);
    // 원래 값으로 복원
    setProfileData({
      studentNum: (studentNum?.toString() || profileData.studentNum || ''),
      name: (userName || profileData.name || ''),
      email: (userEmail || profileData.email || ''),
    });
    setError(null);
  };

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await logoutService(refreshToken);
      }
    } catch (err: any) {
      // 로그아웃 API 실패해도 로컬에서 로그아웃 처리
      console.error('로그아웃 API 실패:', err);
    } finally {
      // API 성공/실패와 관계없이 로컬 로그아웃 처리
      logout();
      // 상태 업데이트 후 홈으로 이동
      navigate('/', { replace: true });
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('정말 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    if (!userId) {
      alert('사용자 ID를 찾을 수 없습니다.');
      return;
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('인증 정보를 찾을 수 없습니다.');
      }
      await withdraw(userId, refreshToken);
      logout();
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/');
    } catch (err: any) {
      alert(err.message || '회원 탈퇴에 실패했습니다.');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (loadingProfile) {
    return (
      <div className="user-profile-container">
        <Header />
        <div className="profile-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <Header />
      <div className="profile-content">
        <h1 className="profile-title">{profileData.name || userName}님의 페이지</h1>
        
        <div className="profile-cards">
          <div className="profile-card">
            <h2 className="card-title">회원 정보</h2>
            {error && <div className="error-message">{error}</div>}
            
            <div className="info-row">
              <label>학번</label>
              <div className="info-value-container">
                {editingField === 'studentNum' ? (
                  <>
                    <input
                      type="text"
                      value={profileData.studentNum}
                      onChange={(e) => setProfileData({ ...profileData, studentNum: e.target.value.replace(/[^0-9]/g, '') })}
                      className="edit-input"
                      maxLength={4}
                    />
                    <div className="edit-buttons">
                      <button onClick={() => handleSave('studentNum')} disabled={loading} className="save-btn">저장</button>
                      <button onClick={() => handleCancel('studentNum')} className="cancel-btn">취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="info-value">{profileData.studentNum || '-'}</span>
                    <button onClick={() => handleEdit('studentNum')} className="edit-icon">✏️</button>
                  </>
                )}
              </div>
            </div>

            <div className="info-row">
              <label>이름</label>
              <div className="info-value-container">
                {editingField === 'name' ? (
                  <>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="edit-input"
                    />
                    <div className="edit-buttons">
                      <button onClick={() => handleSave('name')} disabled={loading} className="save-btn">저장</button>
                      <button onClick={() => handleCancel('name')} className="cancel-btn">취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="info-value">{profileData.name || '-'}</span>
                    <button onClick={() => handleEdit('name')} className="edit-icon">✏️</button>
                  </>
                )}
              </div>
            </div>

            <div className="info-row">
              <label>이메일</label>
              <div className="info-value-container">
                {editingField === 'email' ? (
                  <>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="edit-input"
                    />
                    <div className="edit-buttons">
                      <button onClick={() => handleSave('email')} disabled={loading} className="save-btn">저장</button>
                      <button onClick={() => handleCancel('email')} className="cancel-btn">취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="info-value">{profileData.email || '-'}</span>
                    <button onClick={() => handleEdit('email')} className="edit-icon">✏️</button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h2 className="card-title">계정 관리</h2>
            <button onClick={() => navigate('/change-password')} className="account-action-btn">
              <span className="action-icon">⚙️</span>
              비밀번호 변경
            </button>
            <button onClick={handleLogout} className="account-action-btn">
              <span className="action-icon">🚪</span>
              로그아웃
            </button>
            <button onClick={handleWithdraw} className="account-action-btn withdraw-btn">
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
