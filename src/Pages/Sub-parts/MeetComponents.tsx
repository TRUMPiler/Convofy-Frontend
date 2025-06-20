import  { useState } from "react";
import {

  useMeeting,

} from "@videosdk.live/react-sdk";

export const authToken: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiIxMmRhZDAzYS1mZTYwLTQzNjgtODI1MS0wYWVhZWU1MWNlOTkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc0OTcyOTEzNiwiZXhwIjoxNzgxMjY1MTM2fQ.Da75q68UMwTo325_PgD74qqYj3Ah2Per--IQdU4chNg";

export const createMeeting = async ({ token }: { token: string }) => {
  const res = await fetch(`https://api.videosdk.live/v2/rooms`, {
    method: "POST",
    headers: {
      authorization: `${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const { roomId }: { roomId: string } = await res.json();
  return roomId;
};


function ParticipantView({ participantId }: { participantId: string }) {
  if(participantId!=null)
  {
    console.log(participantId);
    return <div>{participantId}</div>;
  }
  return null;
}

function Controls() {
  const { leave, toggleMic, toggleWebcam } = useMeeting();
  return (
    <div>
      <button onClick={() => leave()}>Leave</button>
      <button onClick={() => toggleMic()}>toggleMic</button>
      <button onClick={() => toggleWebcam()}>toggleWebcam</button>
    </div>
  );
}

function MeetingView({
  onMeetingLeave,
  meetingId,
}: {
  onMeetingLeave: () => void,
  meetingId: string,
}) {
const [joined, setJoined] = useState<string | null>(null);

  //Get the method which will be used to join the meeting.
  //We will also get the participants list to display all participants
  const { join, participants } = useMeeting({
    //callback for when meeting is joined successfully
    onMeetingJoined: () => {
      setJoined("JOINED");
    },
    //callback for when meeting is left
    onMeetingLeft: () => {
      onMeetingLeave();
    },
  });
  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  return (
    <div className="container">
      <h3>Meeting Id: {meetingId}</h3>
      {joined && joined == "JOINED" ? (
        <div>
          <Controls />
          //For rendering all the participants in the meeting
          {[...participants.keys()].map((participantId) => (
            <ParticipantView
              participantId={participantId}
              key={participantId}
            />
          ))}
        </div>
      ) : joined && joined == "JOINING" ? (
        <p>Joining the meeting...</p>
      ) : (
        <button onClick={joinMeeting}>Join</button>
      )}
    </div>
  );
}