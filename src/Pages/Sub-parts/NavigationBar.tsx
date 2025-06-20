import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu"
import Cookies from "js-cookie";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatar:string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data from cookies
    const userId = Cookies.get("userId");
    const userName = Cookies.get("name");
    const userEmail = Cookies.get("email");
    const image = Cookies.get("avatar");
    // const sessionToken = Cookies.get("sessionToken");

    if (userId && userName && userEmail) {
      setUser({ id: userId, name: userName, email: userEmail,avatar:image??"" });
    }
  }, []);

  const handleLogout = () => {
    // Clear user cookies
    Cookies.remove("userId");
    Cookies.remove("name");
    Cookies.remove("email");
    Cookies.remove("avatar");
    // Cookies.remove("sessionToken");

    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white px-4 py-2 shadow-lg">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
          MyApp
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-4">
          <li className="cursor-pointer" onClick={() => navigate("/home")}>
            Home
          </li>
          <li className="cursor-pointer" onClick={() => navigate("/about")}>
            About
          </li>
          <li className="cursor-pointer" onClick={() => navigate("/contact")}>
            Contact
          </li>
        </ul>

        {/* User Profile or Login */}
        <div>
          {user ? (
            <DropdownMenu>  
              <DropdownMenuTrigger>
                <div className="flex items-center space-x-2 cursor-pointer">
                  {/* User Avatar */}
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full" referrerPolicy={'no-referrer'}
                    />):(
                      <img
                        src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                  {/* <img
                    src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
                  /> */}
                  <span>{user.name}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/friends")}>Show Friends</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/account")}>Account Details</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-green-500 px-4 py-2 rounded shadow hover:bg-green-400"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="flex md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="text-xl">&#9776;</button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => navigate("/home")}>Home</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/about")}>About</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/contact")}>Contact</DropdownMenuItem>
            {user && <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
