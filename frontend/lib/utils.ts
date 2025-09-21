import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BATAA_BACKEND_URL = "https://myrmidons-pinequest-backend.vercel.app/";
const BATAA_FRONTEND_URL =
  "https://myrmidons-pinequest-frontend-delta.vercel.app/";

const TINDER_BACKEND_URL = "https://myrmidons-pinequest-of9n.vercel.app/";
const TINDER_FRONTEND_URL = "https://myrmidons-pinequest.vercel.app/";

const LOCAL_BACKEND_URL = "http://localhost:5000/";
const LOCAL_FRONTEND_URL = "http://localhost:3000/";

export const PYTHON_BACKEND_URL =
  "https://myrmidons-pinequest-production.up.railway.app/";

export const axiosInstance = axios.create({
  baseURL: BATAA_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
export const axiosInstanceFront = BATAA_FRONTEND_URL;
