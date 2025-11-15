// import { createContext, useEffect, useState } from "react";
// import axios from 'axios'
// import toast from "react-hot-toast";
// import { io } from "socket.io-client"
// import React from "react";

// const backendUrl = import.meta.env.VITE_BACKEND_URL;
// axios.defaults.baseURL = backendUrl;

// export const AuthContext = createContext();

// export const AuthProvider = ({ children })=>{

//     const [token, setToken] = useState(localStorage.getItem("token"));
//     const [authUser, setAuthUser] = useState(null);
//     const [onlineUsers, setOnlineUsers] = useState([]);
//     const [socket, setSocket] = useState(null);

//     // Check if user is authenticated and if so, set the user data and connect the socket
//     const checkAuth = async () => {
//         try {
//             const { data } = await axios.get("/api/auth/check");
//             if (data.success) {
//                 setAuthUser(data.user)
//                 connectSocket(data.user)
//             }
//         } catch (error) {
//             toast.error(error.message)
//         }
//     }

// // Login function to handle user authentication and socket connection

// const login = async (state, credentials)=>{
//     try {
//         const { data } = await axios.post(`/api/auth/${state}`, credentials);
//         if (data.success){
//             setAuthUser(data.userData);
//             connectSocket(data.userData);
//             axios.defaults.headers.common["token"] = data.token;
//             setToken(data.token);
//             localStorage.setItem("token", data.token)
//             toast.success(data.message)
//         }else{
//             toast.error(data.message)
//         }
//     } catch (error) {
//         toast.error(error.message)
//     }
// }

// // Logout function to handle user logout and socket disconnection

//     const logout = async () =>{
//         localStorage.removeItem("token");
//         setToken(null);
//         setAuthUser(null);
//         setOnlineUsers([]);
//         axios.defaults.headers.common["token"] = null;
//         toast.success("Logged out successfully")
//         socket.disconnect();
//     }

//     // Update profile function to handle user profile updates

//     const updateProfile = async (body)=>{
//         try {
//             const { data } = await axios.put("/api/auth/update-profile", body);
//             if(data.success){
//                 setAuthUser(data.user);
//                 toast.success("Profile updated successfully")
//             }
//         } catch (error) {
//             toast.error(error.message)
//         }
//     }

//     // Connect socket function to handle socket connection and online users updates
//     const connectSocket = (userData)=>{
//         if(!userData || socket?.connected) return;
//         const newSocket = io(backendUrl, {
//             query: {
//                 userId: userData._id,
//             }
//         });
//         newSocket.connect();
//         setSocket(newSocket);

//         newSocket.on("getOnlineUsers", (userIds)=>{
//             setOnlineUsers(userIds);
//         })
//     }

//     useEffect(()=>{
//         if(token){
//             axios.defaults.headers.common["token"] = token;
//         }
//         checkAuth();
//     },[])

//     const value = {
//         axios,
//         authUser,
//         onlineUsers,
//         socket,
//         login,
//         logout,
//         updateProfile
//     }

//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     )
// }
import React from "react";
import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const API = import.meta.env.VITE_BACKEND_URL;  // ⭐ correct backend URL

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ----------- API instance (BEST PRACTICE) -----------
  const axiosInstance = axios.create({
    baseURL: API,
    headers: {
      "Content-Type": "application/json",
      token: token || ""
    }
  });

  // ----------- CHECK AUTH -----------
  const checkAuth = async () => {
    try {
      const { data } = await axiosInstance.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log("Auth error:", error.response?.data || error.message);
    }
  };

  // ----------- LOGIN / SIGNUP -----------
  const login = async (state, credentials) => {
    try {
      const endpoint =
        state === "signup" ? "/api/auth/register" : "/api/auth/login";

      const { data } = await axiosInstance.post(endpoint, credentials);

      if (data.success) {
        setAuthUser(data.userData);

        localStorage.setItem("token", data.token);
        setToken(data.token);

        connectSocket(data.userData);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ----------- LOGOUT -----------
  const logout = () => {
    localStorage.removeItem("token");
    setAuthUser(null);
    setToken(null);
    setOnlineUsers([]);

    if (socket) socket.disconnect();

    toast.success("Logged out successfully");
  };

  // ----------- UPDATE PROFILE -----------
  const updateProfile = async (body) => {
    try {
      const { data } = await axiosInstance.put("/api/auth/update-profile", body);

      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ----------- SOCKET CONNECTION -----------
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(API, {
      query: { userId: userData._id }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    setSocket(newSocket);
  };

  // ----------- INIT APP -----------
  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        updateProfile,
        authUser,
        onlineUsers,
        axiosInstance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};