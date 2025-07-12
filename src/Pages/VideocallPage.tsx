// import React, { useEffect } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { MeetingProvider } from "@videosdk.live/react-sdk";
// import { toast } from 'sonner';
// import Cookies from 'js-cookie';
// import MeetingView from './Sub-parts/MeetingView';

// const VideoCallPage: React.FC = () => {
//     const { meetId } = useParams<{ meetId: string }>();
//     const location = useLocation();
//     const navigate = useNavigate();

//     const queryParams = new URLSearchParams(location.search);
//     const token = queryParams.get('token');
//     const partnerName = queryParams.get('partnerName');
//     const partnerAvatar = queryParams.get('partnerAvatar');
//     const interestId = queryParams.get('interestId');

//     const currentUserId = Cookies.get('userId');

//     useEffect(() => {
//         if (!meetId || !token || !currentUserId || !interestId) {
//             toast.error("Missing call parameters. Please ensure you clicked a valid call link.");
//             navigate('/dashboard');
//         }
//     }, [meetId, token, currentUserId, interestId, navigate]);

//     if (!meetId || !token || !currentUserId || !interestId) {
//         return <div className="text-white text-center p-4 bg-gray-900 min-h-screen">Loading call or invalid parameters...</div>;
//     }

//     return (
//         <MeetingProvider
//             config={{
//                 meetingId: meetId,
//                 micEnabled: true,
//                 webcamEnabled: true,
//                 name: currentUserId,
//                 debugMode: true,
//             }}
//             token={token}
//         >
//             <MeetingView
//                 meetingId={meetId}
//                 onMeetingLeave={() => navigate(`/chatroom/${interestId}`)}
//                 partnerName={partnerName || ""}
//                 partnerAvatar={partnerAvatar || ""}
//                 interestId={interestId || ""}
//             />
//         </MeetingProvider>
//     );
// };

// export default VideoCallPage;