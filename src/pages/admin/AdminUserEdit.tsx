import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/header';
import { useAuth } from '../../contexts/AuthContext';
import { updateAdminUser, getUserById } from '../../services/admin';
import './AdminUserEdit.css';

interface UserInfo {
  userId: number;
  studentNum: number;
  name: string;
  email: string;
}

export default function AdminUserEdit() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAdmin } = useAuth();

  /* =========================
     권한 체크
  ========================= */
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
    }
  }, [isLoggedIn, isAdmin, navigate]);

  /* =========================
     초기 데이터 (state or API)
  ========================= */
  const state = location.state as { student?: UserInfo } | null;
  const [user, setUser] = useState<UserInfo | null>(
    state?.student ?? null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // state로 못 받은 경우 API 조회
    if (!user) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const data = await getUserById(Number(userId));
      setUser(data);
    } catch {
      alert('학생 정보를 불러올 수 없습니다.');
      navigate('/students');
    }
  };

  if (!user) return null;

  /* =========================
     입력 상태
  ========================= */
  const [studentNum, setStudentNum] = useState(user.studentNum.toString());
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* =========================
     변경 여부 판단
  ========================= */
  const isInfoChanged =
    studentNum !== user.studentNum.toString() ||
    name !== user.name ||
    email !== user.email;

  const isPasswordChanged =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const isFormValid = isInfoChanged || isPasswordChanged;

  /* =========================
     저장
  ========================= */
  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      setLoading(true);

      await updateAdminUser(user.userId, {
        studentNum: Number(studentNum),
        name,
        email,
        ...(isPasswordChanged && { newPassword }),
      });

      alert('회원 정보가 수정되었습니다.');
      navigate('/students');
    } catch (err: any) {
      alert(err.message || '회원 정보 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     렌더링
  ========================= */
  return (
    <div className="admin-user-edit-container">
      <Header />

      <div className="admin-user-edit-content">
        <h1 className="admin-user-edit-title">학생 정보 강제 수정</h1>

        <div className="edit-card">
          <div className="input-row">
            <label>학번</label>
            <input
              value={studentNum}
              onChange={(e) =>
                setStudentNum(e.target.value.replace(/[^0-9]/g, ''))
              }
            />
          </div>

          <div className="input-row">
            <label>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="input-row">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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
              disabled={!isFormValid || loading}
              onClick={handleSubmit}
            >
              수정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
