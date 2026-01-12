import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import './Signup.css';
import { signup as signupService } from '../../services/auth';

const Signup: React.FC = () => {
  const [studentNum, setStudentNum] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // 필수 입력 체크
    if (!studentNum || !name || !email || !password || !passwordConfirm) {
      setError('모든 칸을 입력해 주세요.');
      return;
    }
    if (!/^[0-9]{4}$/.test(studentNum)) {
      setError('학번은 4자리 숫자여야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await signupService({ email, name, password, studentNum: Number(studentNum) });
      alert('회원가입이 완료되었습니다! 로그인 해주세요.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-root">
      <div className="signup-box">
        <img src={logo} className="school-logo" alt="경북소프트웨어마이스터고등학교" />
        <h2 className="signup-title">회원가입</h2>
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="signup-row">
            <label className="input-label signup-input-half">
              학번(ex 1111)
              <input
                type="text"
                value={studentNum}
                onChange={e => setStudentNum(e.target.value.replace(/[^0-9]/g, ''))}
                className="signup-input"
                placeholder="학번을 입력하세요"
                required
                maxLength={4}
                minLength={4}
              />
            </label>
            <label className="input-label signup-input-half">
              이름(실명)
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="signup-input"
                placeholder="실명을 입력하세요"
                required
              />
            </label>
          </div>
          <label className="input-label">
            이메일
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="signup-input"
              placeholder="이메일을 입력하세요"
              required
            />
          </label>
          <label className="input-label">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="signup-input"
              placeholder="비밀번호를 입력하세요 (8자리 이상)"
              required
              minLength={8}
            />
          </label>
          <label className="input-label">
            비밀번호 확인
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              className="signup-input"
              placeholder="비밀번호를 한 번 더 입력하세요"
              required
              minLength={8}
            />
          </label>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="signup-btn" disabled={loading}>{loading ? '회원가입 중...' : '회원가입'}</button>
        </form>
        <div className="login-guide">
          이미 계정이 있으신가요?{' '}
          <a href="/login">로그인</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
