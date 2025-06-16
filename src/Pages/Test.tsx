import PermissionsSetup from '../Components/Checkpermission';
import NavigationBar from '../Pages/Sub-parts/NavigationBar';
function Test() {
  // Specify the type of the HTMLVideoElement

  return (
    <div>
      <NavigationBar />
      <PermissionsSetup link="/setGG" />
    </div>
  );
}

export default Test;