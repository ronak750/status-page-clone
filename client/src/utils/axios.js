import axios from "axios";

// Create axios instance with base URL
const instance = axios.create({
  baseURL: "", // Hard-coding for local testing
  headers: {
    "Content-Type": "application/json",
  },
});

export default instance;
