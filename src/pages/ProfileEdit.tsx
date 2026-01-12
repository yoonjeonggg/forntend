import { useState } from "react";
import "../ProfileEdit.css";

const ProfileEdit = () => {
  const [studentId] = useState("2103");
  const [name, setName] = useState("김나혜");
  const [email, setEmail] = useState("1234@gmail.com");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: API 연동
    console.log({
      studentId,
      name,
      email,
    });

    alert("수정되었습니다.");
  };

  return (
    <div className="profile-edit-page">
      {/* 상단 헤더 */}
      <header className="header">
        <div className="logo">
          경북소프트웨어마이스터고
        </div>
        <div className="user-info">
          관리자 사용자 님
        </div>
      </header>

      {/* 카드 */}
      <div className="card">
        <h2 className="title">회원 정보 수정</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>학번</label>
              <input value={studentId} disabled />
            </div>

            <div className="form-group">
              <label>이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>이메일</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="button-group">
            <button type="button" className="cancel">
              취소
            </button>
            <button type="submit" className="submit">
              수정하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
