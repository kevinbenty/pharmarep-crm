import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchInteractions = createAsyncThunk('interactions/fetchAll', () => api.listInteractions());

export const createInteraction = createAsyncThunk('interactions/create', (data) => api.createInteraction(data));

export const updateInteraction = createAsyncThunk('interactions/update', ({ id, data }) => api.updateInteraction(id, data));

export const deleteInteraction = createAsyncThunk('interactions/delete', async (id) => {
  await api.deleteInteraction(id);
  return id;
});

export const sendChatMessage = createAsyncThunk('chat/send', ({ message, history }) => api.sendChat(message, history));

// ─── Interactions Slice ───────────────────────────────────────────────────────
const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: { items: [], loading: false, error: null, selected: null },
  reducers: {
    setSelected: (state, action) => { state.selected = action.payload; },
    clearSelected: (state) => { state.selected = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => { state.loading = true; })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false; state.items = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false; state.error = action.error.message;
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateInteraction.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.selected = action.payload;
      })
      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
        state.selected = null;
      });
  }
});

// ─── Chat Slice ───────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: 'chat',
  initialState: { messages: [], loading: false },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload });
    },
    clearChat: (state) => { state.messages = []; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => { state.loading = true; })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({ role: 'assistant', content: action.payload });
      })
      .addCase(sendChatMessage.rejected, (state) => { state.loading = false; });
  }
});

export const { setSelected, clearSelected } = interactionsSlice.actions;
export const { addUserMessage, clearChat } = chatSlice.actions;

export const store = configureStore({
  reducer: {
    interactions: interactionsSlice.reducer,
    chat: chatSlice.reducer,
  }
});
