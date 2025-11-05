import { useEffect } from 'react';
import { axiosPrivate, axiosPublic } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const useAxiosPrivate = () => {
  const { accessToken, setAccessToken, logout } = useAuth(); // Get auth state and new functions

  useEffect(() => {

    // --- 1. Request Interceptor ---
    // This runs *before* each request
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        // If the Authorization header doesn't exist, add it
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      }, 
      (error) => Promise.reject(error)
    );

    // --- 2. Response Interceptor ---
    // This runs *after* a response is received
    const responseIntercept = axiosPrivate.interceptors.response.use(
      // If response is successful, just return it
      (response) => response,

      // If response is an error (e.g., 401 token expired)
      async (error) => {
        const originalRequest = error.config;

        // Check if the error is 401 (Unauthorized) and we haven't retried yet
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Mark that we've retried once

          try {
            // --- 3. Call the Refresh Endpoint ---
            // We use the "public" axios instance for this
            // We need to get the new CSRF token from the refresh response
            const refreshResponse = await axiosPublic.post('/auth/refresh');
            
            const newAccessToken = refreshResponse.data.accessToken;
            const newCsrfToken = refreshResponse.data.csrfToken;

            // --- 4. Update our Auth Context ---
            setAccessToken(newAccessToken, newCsrfToken); // Update the hook

            // --- 5. Retry the original request ---
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            // We also need to update the CSRF token for *this* request
            // This assumes your POST/PUT/DELETE requests will be setup to get it
            
            return axiosPrivate(originalRequest); // Re-send the original request

          } catch (refreshError) {
            // If the refresh fails (e.g., refresh token expired)
            console.error('Refresh token failed', refreshError);
            logout(); // Log the user out
            return Promise.reject(refreshError);
          }
        }
        
        // For any other errors, just reject
        return Promise.reject(error);
      }
    );

    // Cleanup function: remove interceptors when component unmounts
    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };

  }, [accessToken, setAccessToken, logout]); // Re-run if auth state changes

  return axiosPrivate; // Return the "smart" axios instance
};

export default useAxiosPrivate;