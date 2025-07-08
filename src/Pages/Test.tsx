import PermissionsSetup from '../Components/Checkpermission'; // Assuming this is Checkpermission.tsx
import NavigationBar from '../Pages/Sub-parts/NavigationBar';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import Cookies from 'js-cookie';
import { useEffect } from 'react';


function Test() {
  const navigate = useNavigate();
  const { interestId } = useParams<{ interestId: string }>(); // 1. Fetch interestId from the URL

  const CheckLogin = () => {
    if (!Cookies.get("userId")) {
      navigate("/login");
    }
  }

  useEffect(() => {
    CheckLogin();
  }, []);

  return (
    <div>
      <NavigationBar />
      {/* Pass the interestId down to PermissionsSetup */}
      <PermissionsSetup interestId={interestId} />
    </div>
  );
}

export default Test;