import React from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'sonner';
interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

interface ChatMessageResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
}

// Union type for the 'user' prop
type UserProfileModalProps = {
  user: OnlineUser | ChatMessageResponse;
  onClose: () => void;
};


const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  
const handleAddFriend=async()=>{
    try{
        const userId=Cookies.get("userId");
        const friendId=(user as OnlineUser).userId??(user as ChatMessageResponse).userId??"";
    const response=await axios.post('https://api.convofy.fun/api/friends/add',{
        "userId":userId,
        "friendId":friendId
    },{headers:{'Content-Type':'application/json'}});
    console.log(response.data);
    if(response.data.success){
      toast.success(response.data.message);
    }
    }catch(err:any){
        console.error('Error adding friend:', err);
        toast.error('An error occurred while adding friend.');
    }
}
  const userName = (user as OnlineUser).name || (user as ChatMessageResponse).userName;
  const userEmail = (user as OnlineUser).email;
  const userAvatar = (user as OnlineUser).avatar || (user as ChatMessageResponse).userAvatar || 'https://ui-avatars.com/api/?name=NA&background=random';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-card text-foreground rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-95 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">User Profile</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Close profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <img
            src={userAvatar}
            alt={userName}
            className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg mb-4"
            referrerPolicy='no-referrer'
          />
          <h3 className="text-xl font-semibold text-foreground mb-1">{userName}</h3>
          {/* {userEmail && <p className="text-sm text-muted-foreground">{userEmail}</p>} */}
          {/* <p className="text-xs text-muted-foreground mt-1">User ID: {(user as OnlineUser).userId || (user as ChatMessageResponse).userId}</p> */}
        </div>

        <div className="text-center text-sm text-muted-foreground italic">
            {userEmail!=Cookies.get('email')&&(
                <button className='bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold
                       hover:bg-primary/90 transition-colors duration-300 shadow-md
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75' onClick={handleAddFriend}>Add Friend</button>      
            )}
          
          {/* <p>More profile details would appear here.</p>
          <p>For now, this shows basic user information.</p> */}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold
                       hover:bg-primary/90 transition-colors duration-300 shadow-md
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
