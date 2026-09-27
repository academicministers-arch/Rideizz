import axios from "axios";
import { auth } from "../config/firebase";

// Backend URL - this is your GitHub Codespaces forwarded port.
// If you regenerate/restart the Codespace, this URL can change - check the
// Ports tab in VS Code and update this if requests start failing.
export const api = axios.create({
  baseURL: "https://bug-free-system-wrwj7pgvwq76fgx79-8000.app.github.dev",
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});