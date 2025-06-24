import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/ui/dropdown-menu"; // Adjust path if necessary
import Cookies from "js-cookie";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<{ id: string; name: string; email: string; avatar: string } | null>(null);
  const [isScrolled, setIsScrolled] = useState(false); // New state to track scroll
  const navigate = useNavigate();

  // Effect to read user data from cookies on component mount
  useEffect(() => {
    const userId = Cookies.get("userId");
    const userName = Cookies.get("name");
    const userEmail = Cookies.get("email");
    const image = Cookies.get("avatar");

    if (userId && userName && userEmail) {
      setUser({ id: userId, name: userName, email: userEmail, avatar: image ?? "" });
    }
  }, []);

  // Callback function to handle scroll event
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY;
    // You can adjust this threshold (e.g., 50) based on when you want the effect to kick in
    setIsScrolled(scrollPosition > 50);
  }, []);

  // Effect to add and clean up the scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]); // Re-run effect if handleScroll changes (though it's memoized by useCallback)

  const handleLogout = () => {
    Cookies.remove("userId");
    Cookies.remove("name");
    Cookies.remove("email");
    Cookies.remove("avatar");
    setUser(null);
    navigate("/login");
  };

  // Determine navbar classes based on scroll state
  const navbarClasses = `
    fixed top-0 left-0 right-0 z-50
    px-4 py-2 shadow-lg
    transition-all duration-500 ease-in-out
    ${isScrolled
      ? 'bg-gradient-to-r from-blue-900 to-indigo-900 bg-opacity-70 backdrop-filter backdrop-blur-sm'
      : 'bg-gradient-to-r from-blue-600 to-blue-800'
    }
    text-white
  `;

  return (
    <nav className={navbarClasses}>
      <div className="flex justify-between items-center container mx-auto"> {/* Added container mx-auto for centering */}
        {/* Logo */}
        <div className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
          Convofy {/* Changed from MyApp to Convofy as per project name */}
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-4">
          <li className="cursor-pointer hover:text-blue-200" onClick={() => navigate("/home")}>
            Home
          </li>
          <li className="cursor-pointer hover:text-blue-200" onClick={() => navigate("/about")}>
            About
          </li>
          <li className="cursor-pointer hover:text-blue-200" onClick={() => navigate("/contact")}>
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
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy={'no-referrer'}
                    />
                  ) : (
                    <img
                      src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{user.name}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 text-white border border-gray-700"> {/* Added dropdown styling */}
                <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/friends")}>Show Friends</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/account")}>Account Details</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-700 text-red-400 cursor-pointer" onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-green-500 px-4 py-2 rounded shadow hover:bg-green-400 transition-colors duration-300"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Consider using a hamburger icon for better UX */}
      <div className="md:hidden flex justify-end mt-2"> {/* Moved mobile menu to align right and added margin-top */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="text-xl p-2 rounded-full hover:bg-white hover:bg-opacity-10 transition-colors duration-300">&#9776;</button> {/* Added styling to hamburger */}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 text-white border border-gray-700"> {/* Added dropdown styling */}
            <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/home")}>Home</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/about")}>About</DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/contact")}>Contact</DropdownMenuItem>
            {user && <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>}
            {user && <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/friends")}>Show Friends</DropdownMenuItem>} {/* Added for consistency */}
            {user && <DropdownMenuItem className="hover:bg-gray-700 text-red-400 cursor-pointer" onClick={handleLogout}>Logout</DropdownMenuItem>} {/* Added for consistency */}
            {!user && <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer" onClick={() => navigate("/login")}>Login</DropdownMenuItem>} {/* Added for consistency */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;