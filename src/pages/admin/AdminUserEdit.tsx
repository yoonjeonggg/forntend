import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/header';
import { useAuth } from '../../contexts/AuthContext';
import { updateAdminUser } from '../../services/admin';
import './AdminUserEdit.css';

interface UserInfo {
  userId: number;
  studentNum: number;
  name: string;
  email: string;
}

export default function AdminUserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAdmin } = useAuth();

  const state = location.state as { student?: UserInfo } | null;
  const [user] = useState<UserInfo | null>(state?.student ?? null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ 버튼 활성화 조건
  const isFormValid =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  if (!isLoggedIn || !isAdmin) {
    alert('관리자만 접근할 수 있습니다.');
    navigate('/');
    return null;
  }

  if (!user || !userId) {
    alert('학생 정보가 없습니다. 다시 선택해주세요.');
    navigate('/students');
    return null;
  }

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      setLoading(true);

      await updateAdminUser(Number(userId), {
        email: user.email,
        name: user.name,
        studentNum: user.studentNum,
        newPassword,
      });

      alert('비밀번호가 변경되었습니다.');
      navigate('/students');
    } catch (err: any) {
      alert(err.message || '비밀번호 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-user-edit-container">
      <Header />

      <div className="admin-user-edit-content">
        <h1 className="admin-user-edit-title">회원 정보 수정</h1>

        <div className="edit-card">
          <div className="info-row">
            <label>학번</label>
            <span>{user.studentNum}</span>
          </div>

          <div className="info-row">
            <label>이름</label>
            <span>{user.name}</span>
          </div>

          <div className="info-row">
            <label>이메일</label>
            <span>{user.email}</span>
          </div>

          <div className="divider" />

          <div className="input-row">
            <label>새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="input-row">
            <label>비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="button-group">
            <button
              className="cancel-btn"
              onClick={() => navigate('/students')}
              disabled={loading}
            >
              취소
            </button>

            <button
              className={`submit-btn ${isFormValid ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={!isFormValid || loading}
            >
              수정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
