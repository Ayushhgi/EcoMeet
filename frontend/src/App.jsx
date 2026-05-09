// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Authentication from './pages/authentication.jsx';

import './App.css';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeeting from './pages/VideoMeeting.jsx';
// import { AuthContext } from './contexts/AuthContext.jsx';
import HomeComponent from './pages/home';
import History from './pages/history';

function App() {
  return (
    <Router>
      <AuthProvider>
      <Routes>
          <Route path='/home's element={<HomeComponent />} />
          <Route path='/history' element={<History />} />
          <Route path='/' element={<Landing />} />
          <Route path='/auth' element={<Authentication />} />
          <Route path='/:url' element={<VideoMeeting/>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
