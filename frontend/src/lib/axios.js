import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:9002/api" : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request ("is request ke saath cookies, sessions, authentication credentials bhi bhejo")
});
