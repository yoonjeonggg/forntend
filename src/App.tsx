
import MyChat from './pages/chat/MyChat';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Signup } from './pages/auth';
import { PublicBoard } from './pages/board';
import { ChatDetail } from './pages/chat';
import Home from './pages/Home';
import UserProfile from './pages/UserProfile';
import ChangePassword from './pages/ChangePassword';
import Students from './pages/Students';
import SurveyModal from './components/SurveyModel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/boards/public" element={<PublicBoard />} />
        <Route path="/chats/:chatRoomId" element={<ChatDetail />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/students" element={<Students />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path='/chat-setting' element={<SurveyModal />} />
        <Route path="/my-chat" element={<MyChat />} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;