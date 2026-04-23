import axios from 'axios';
import { apiBaseUrl } from './apiConfig';

const API = axios.create({
  baseURL: apiBaseUrl,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pls_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;
