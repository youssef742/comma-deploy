import axios from "axios";

const api = axios.create({
  baseURL: "", // Backend API URL
});

export default api;
