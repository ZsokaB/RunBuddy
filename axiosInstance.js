import axios from "axios";
import { config } from "./utils/config";

const api = axios.create({
  baseURL: config.baseURL,
});

export default api;
