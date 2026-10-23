// API layer used by the Redux store.
// Normal build: talks to the FastAPI backend (VITE_API_URL, default localhost:8000).
// Demo build (VITE_DEMO_MODE=true, used for GitHub Pages): uses demoApi.js,
// which runs entirely in the browser with sample data.
import axios from 'axios';
import * as demoApi from './demoApi';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const backendApi = {
  listInteractions: async () => (await axios.get(`${API_URL}/interactions`)).data,
  createInteraction: async (data) => (await axios.post(`${API_URL}/interactions`, data)).data,
  updateInteraction: async (id, data) => (await axios.put(`${API_URL}/interactions/${id}`, data)).data,
  deleteInteraction: async (id) => { await axios.delete(`${API_URL}/interactions/${id}`); },
  sendChat: async (message, history) =>
    (await axios.post(`${API_URL}/chat`, { message, history })).data.response,
};

export const api = DEMO_MODE ? demoApi : backendApi;
export const resetDemoData = demoApi.resetDemoData;
