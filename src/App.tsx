import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Signup } from './pages/auth';
import { PublicBoard } from './pages/board';
import Home from './pages/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/boards/public" element={<PublicBoard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;