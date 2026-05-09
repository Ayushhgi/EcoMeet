import axios from "axios";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import httpstatus from "http-status";
import server from "../../environment";

// Context create
export const AuthContext = createContext(); //global state container banaya he

// Axios client
const client = axios.create({
  baseURL: `${server}/user`,
});

// AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null); // default null or {}
  const navigate = useNavigate(); 
  // Registration Handler
  const handleRegister = async (name, username, password) => {
    try {
      let response = await client.post("/register", {
      name: name,
      username: username,
      password: password,
      });

      // console.log(response.data.msg);

      if (response.status === httpstatus.CREATED) {
        return response.data.msg; // e.g. "User created successfully"
      }
    } catch (err) {
      throw err;
    }
  };
  const handleLogin = async (username, password) => {
    try {
      let response = await client.post("/login", {
      username: username,
      password: password,
      });
      // console.log(response);

      if (response.status === httpstatus.OK) {
       localStorage.setItem("token",response.data.token);
       navigate("/")
      }
    } catch (err) {
      throw err;
    }
  };
      const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }


  // Auth Context Data
  // const data = {
  //   userData,
  //   setUserData,
  //   handleRegister,
  //   handleLogin,
  // };

  return (
    <AuthContext.Provider value={{ setUserData, addToUserHistory, getHistoryOfUser, handleRegister, handleLogin}}>
      {children}
    </AuthContext.Provider>
  );
};
