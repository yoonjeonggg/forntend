import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import './Login.css';
import { login as loginService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { refreshToken, accessToken } = await loginService({ email, password });
      login(accessToken, refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-box">
        <img src={logo} className="school-logo" alt="경북소프트웨어마이스터고등학교" />
        <h2 className="login-title">로그인</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="input-label">
            아이디(이메일)
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
              className="login-input"
              autoComplete="username"
            />
          </label>
          <label className="input-label">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="login-input"
              autoComplete="current-password"
            />
          </label>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
        </form>
        <div className="register-guide">
          아직 계정이 없으신가요?{' '}
          <a href="/register">회원가입</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
