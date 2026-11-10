import axios from 'axios';
export const baseURL = 'https://api.wesis2026.com/api';
//export const baseURL = 'http://localhost:3000/api';
const api = axios.create({
  baseURL: baseURL,
});
export default api;
