let server = import.meta.env.MODE==="production"
  ? "https://backendecomeet.onrender.com/api"
  : "http://localhost:9002/api";


  let socketUrl = import.meta.env.MODE === "production"
  ? "https://backendecomeet.onrender.com"
  : "http://localhost:9002";

export { socketUrl };
export default server;