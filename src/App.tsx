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
// import JoinMeetingPage from './Pages/JoinMeetingPage';
import InterestsPage from './Pages/InterestPage';
import ChatroomPage from './Pages/ChatRoom';
import Preloader from './Components/Preloader';
import NotFound from './Components/PageNotFound';
import AboutUsPage from './Pages/AboutUsPage';
import PreloaderTestPage from './Pages/PreloaderTestPage';
import MailForm from './Pages/Contact';
import Dashboard from './Pages/dashboard';

function App() {
  return (
    <>
    <Toaster />
    <Preloader>
    <Router>
      <Routes>
      <Route path="/" element={<InterestsPage />} />
      <Route path="/Test/:interestId" element={<Test />} />
      <Route path="/Login" element={<LoginPage />} />
      <Route path="/Register" element={<RegisterPage />} />
      <Route path="/WS" element={<WsChecker />} />
 <Route path="/waiting/:interestId" element={<WaitingRoom />} />
      <Route path="/create" element={<CreateMeeting />}/>
      <Route path="/join/:meetid" element={<JoinMeeting />} />
      <Route path="/Interests" element={<InterestsPage />} />
       <Route path="/ChatRoom/:chatroomId" element={<ChatroomPage/>} />
       <Route path='/about' element={<AboutUsPage />}/>
       <Route path="/contact" element={<MailForm />} />
       <Route path="/dashboard" element={<Dashboard />} />
       <Route path="*" element={<NotFound />} />
      </Routes>
      </Router>
      </Preloader>
    </>
  )
}

export default App
