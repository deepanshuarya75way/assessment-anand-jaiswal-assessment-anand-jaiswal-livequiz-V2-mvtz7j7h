import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MockAPI, QuizSession } from '@/lib/api';

interface LeaderboardState {
  session: QuizSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  session: null,
  loading: false,
  error: null,
};

export const fetchSession = createAsyncThunk(
  'leaderboard/fetchSession',
  async (code: string, { rejectWithValue }) => {
    try {
      const session = await MockAPI.getSession(code);
      return session;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load session');
    }
  }
);

export const advanceSessionQuestion = createAsyncThunk(
  'leaderboard/nextQuestion',
  async (code: string, { rejectWithValue }) => {
    try {
      const session = await MockAPI.nextQuestion(code);
      return session;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to move to next question');
    }
  }
);

export const terminateSession = createAsyncThunk(
  'leaderboard/endSession',
  async (code: string, { rejectWithValue }) => {
    try {
      const session = await MockAPI.endSession(code);
      return session;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to end session');
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<QuizSession | null>) => {
      state.session = action.payload;
    },
    syncSessionState: (state, action: PayloadAction<QuizSession>) => {
      state.session = action.payload;
    },
    updateLeaderboardPlayers: (state, action: PayloadAction<any>) => {
      if (state.session) {
        state.session.players = action.payload;
      }
    },
    clearLeaderboardError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Session
    builder.addCase(fetchSession.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSession.fulfilled, (state, action: PayloadAction<QuizSession>) => {
      state.loading = false;
      state.session = action.payload;
      state.error = null;
    });
    builder.addCase(fetchSession.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Next Question
    builder.addCase(advanceSessionQuestion.fulfilled, (state, action: PayloadAction<QuizSession>) => {
      state.session = action.payload;
    });

    // End Session
    builder.addCase(terminateSession.fulfilled, (state, action: PayloadAction<QuizSession>) => {
      state.session = action.payload;
    });
  },
});

export const { setSession, syncSessionState, updateLeaderboardPlayers, clearLeaderboardError } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
