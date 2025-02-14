import axios from 'axios';

const api = axios.create({
  baseURL: 'https://3079-2a01-c844-2015-9200-b15c-895a-22f3-d2d3.ngrok-free.app/api', 
});

export default api;
