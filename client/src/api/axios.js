import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Create a basic "public" axios instance
// This one doesn't need an access token
export const axiosPublic = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // This is crucial for sending/receiving cookies
});


// Create a "private" axios instance
// We will intercept this instance to add the JWT access token
// and handle token refresh
export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // This is crucial for sending/receiving cookies
});