let server = import.meta.env.MODE==="production"
  ? "https://backendecomeet.onrender.com/api"
  : "http://localhost:9002/api";

export default server;