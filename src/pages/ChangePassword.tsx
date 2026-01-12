import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/auth';
import './ChangePassword.css';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = '기존 비밀번호를 입력해주세요.';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = '비밀번호는 8자리 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = '새 비밀번호는 기존 비밀번호와 달라야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await changePassword(formData.oldPassword, formData.newPassword);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate('/profile');
    } catch (err: any) {
      if (err.message.includes('기존 비밀번호') || err.message.includes('일치하지 않습니다') || err.message.includes('currentPassword')) {
        setErrors({ oldPassword: '기존 비밀번호가 일치하지 않습니다.' });
      } else {
        alert(err.message || '비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="change-password-container">
      <Header />
      <div className="change-password-content">
        <div className="password-form-card">
          <h1 className="password-title">비밀번호</h1>
          
          <form onSubmit={handleSubmit} className="password-form">
            <div className="form-group">
              <label className="form-label">기존 비밀번호</label>
              <input
                type="password"
                value={formData.oldPassword}
                onChange={(e) => {
                  setFormData({ ...formData, oldPassword: e.target.value });
                  if (errors.oldPassword) {
                    setErrors({ ...errors, oldPassword: '' });
                  }
                }}
                className={`form-input ${errors.oldPassword ? 'error' : ''}`}
                placeholder="기존 비밀번호를 입력하세요"
              />
              {errors.oldPassword && (
                <div className="error-message">{errors.oldPassword}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">새 비밀번호</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData({ ...formData, newPassword: e.target.value });
                  if (errors.newPassword) {
                    setErrors({ ...errors, newPassword: '' });
                  }
                }}
                className={`form-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="새 비밀번호를 입력하세요 (8자리 이상)"
              />
              {errors.newPassword && (
                <div className="error-message">{errors.newPassword}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호 확인</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: '' });
                  }
                }}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="비밀번호를 한 번 더 입력하세요"
              />
              {errors.confirmPassword && (
                <div className="error-message">{errors.confirmPassword}</div>
              )}
            </div>

            <div className="form-buttons">
              <button type="button" onClick={handleCancel} className="cancel-button">
                취소
              </button>
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
