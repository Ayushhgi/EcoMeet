import axios from "axios";
import server from "../../environment";

const BASE_URL = server ;
console.log(BASE_URL)

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request ("is request ke saath cookies, sessions, authentication credentials bhi bhejo")
});
