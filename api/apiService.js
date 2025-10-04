import axios from "axios";

const apiService = axios.create({
  baseURL: "http://192.168.100.235:5271/api/auth",
});

export default apiService;
