import axios from "axios";
import { auth } from "../config/firebase";

// Point this at your FastAPI backend.
// - iOS simulator: http://localhost:8000
// - Android emulator: http://10.0.2.2:8000
// - Physical device: http://<your-computer-LAN-IP>:8000
export const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
