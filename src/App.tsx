import { BrowserRouter as Router, Routes, Route } from 'react-router'
import './App.css'
import Test from './Pages/Test'
import { Toaster } from "./Components/ui/sonner";
import LoginPage from './Pages/Login';
import RegisterPage from './Pages/Register';
import CreateMeeting from './Pages/TestingMeet';
import JoinMeeting from './Pages/TestingMeet';
import WaitingRoom from './Pages/WaitingQueue';
import WsChecker from './Pages/WsChecker';
import JoinMeetingPage from './Pages/JoinMeetingPage';
import InterestsPage from './Pages/InterestPage';
import ChatroomPage from './Pages/ChatRoom';

function App() {
  return (
    <>
    <Toaster />
    <Router>
      <Routes>
      <Route path="/" element={<Test />} />
      <Route path="/Login" element={<LoginPage />} />
      <Route path="/Register" element={<RegisterPage />} />
      <Route path="/WS" element={<WsChecker />} />
      <Route path="/Waiting" element={<WaitingRoom />} />
      <Route path="/create" element={<CreateMeeting />}/>
      <Route path="/join/:meetid" element={<JoinMeetingPage />} />
      <Route path="/Interests" element={<InterestsPage />} />
       <Route path="/ChatRoom/:chatroomId" element={<ChatroomPage/>} />
      </Routes>
      </Router>
    </>
  )
}

export default App
