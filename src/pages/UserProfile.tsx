import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import { useAuth } from '../contexts/AuthContext';
import { logout as logoutService, withdraw, updateUserInfo } from '../services/auth';
import './UserProfile.css';

export default function UserProfile() {
  const navigate = useNavigate();
  const { isLoggedIn, userName, userId, userEmail, studentNum, logout, updateUserInfo: updateContext } = useAuth();
  const [editingField, setEditingField] = useState<'studentNum' | 'name' | 'email' | null>(null);
  const [editValues, setEditValues] = useState({
    studentNum: studentNum?.toString() || '',
    name: userName || '',
    email: userEmail || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setEditValues({
      studentNum: studentNum?.toString() || '',
      name: userName || '',
      email: userEmail || '',
    });
  }, [isLoggedIn, studentNum, userName, userEmail, navigate]);

  const handleEdit = (field: 'studentNum' | 'name' | 'email') => {
    setEditingField(field);
    setError(null);
  };

  const handleSave = async (field: 'studentNum' | 'name' | 'email') => {
    if (!userId) {
      setError('사용자 ID를 찾을 수 없습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newStudentNum = field === 'studentNum' ? Number(editValues.studentNum) : studentNum || 0;
      const newName = field === 'name' ? editValues.name : userName;
      const newEmail = field === 'email' ? editValues.email : userEmail;

      await updateUserInfo(userId, newEmail, newName, newStudentNum);
      updateContext(newName, newEmail, newStudentNum);
      setEditingField(null);
    } catch (err: any) {
      setError(err.message || '정보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (field: 'studentNum' | 'name' | 'email') => {
    setEditingField(null);
    setEditValues({
      studentNum: studentNum?.toString() || '',
      name: userName || '',
      email: userEmail || '',
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
      logout();
      navigate('/');
    } catch (err: any) {
      alert(err.message || '로그아웃에 실패했습니다.');
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

  return (
    <div className="user-profile-container">
      <Header />
      <div className="profile-content">
        <h1 className="profile-title">{userName}님의 페이지</h1>
        
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
                      value={editValues.studentNum}
                      onChange={(e) => setEditValues({ ...editValues, studentNum: e.target.value.replace(/[^0-9]/g, '') })}
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
                    <span className="info-value">{studentNum || '-'}</span>
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
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="edit-input"
                    />
                    <div className="edit-buttons">
                      <button onClick={() => handleSave('name')} disabled={loading} className="save-btn">저장</button>
                      <button onClick={() => handleCancel('name')} className="cancel-btn">취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="info-value">{userName || '-'}</span>
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
                      value={editValues.email}
                      onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                      className="edit-input"
                    />
                    <div className="edit-buttons">
                      <button onClick={() => handleSave('email')} disabled={loading} className="save-btn">저장</button>
                      <button onClick={() => handleCancel('email')} className="cancel-btn">취소</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="info-value">{userEmail || '-'}</span>
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
