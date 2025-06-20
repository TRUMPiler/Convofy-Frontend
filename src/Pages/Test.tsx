import PermissionsSetup from '../Components/Checkpermission';
import NavigationBar from '../Pages/Sub-parts/NavigationBar';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useEffect } from 'react';


function Test() {
  const navigate = useNavigate();
  // Specify the type of the HTMLVideoElement
 const CheckLogin=()=>
 {
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
      <PermissionsSetup />
    </div>
  );
}

export default Test;