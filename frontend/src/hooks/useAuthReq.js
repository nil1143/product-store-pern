import { useAuth } from "@clerk/react";
import { useEffect, useRef } from "react";
import api from "../lib/axios";

let isInterceptorRegistered = false;

function useAuthReq() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const authStateRef = useRef({ isSignedIn: false, getToken: null });

  // Update the ref with the latest auth state in an effect
  useEffect(() => {
    authStateRef.current = { isSignedIn, getToken };
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isInterceptorRegistered) return;
    isInterceptorRegistered = true;

    const interceptor = api.interceptors.request.use(async (config) => {
      const { isSignedIn, getToken } = authStateRef.current;
      if (isSignedIn && getToken) {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptor);
      isInterceptorRegistered = false;
    };
  }, []);

  return { isSignedIn, isClerkLoaded: isLoaded };
}

export default useAuthReq;