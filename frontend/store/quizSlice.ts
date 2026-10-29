import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MockAPI, Quiz } from '@/lib/api';

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  loading: boolean;
  error: string | null;
  analytics: any[] | null;
  overallAnalytics: { totalPlays: number; avgParticipants: number; quizzesStats: any[] } | null;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null,
  analytics: null,
  overallAnalytics: null,
};

export const fetchQuizzes = createAsyncThunk(
  'quiz/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await MockAPI.getQuizzes();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch quizzes');
    }
  }
);

export const fetchQuizById = createAsyncThunk(
  'quiz/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await MockAPI.getQuizById(id);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch quiz');
    }
  }
);

export const saveQuiz = createAsyncThunk(
  'quiz/save',
  async (quizData: any, { rejectWithValue }) => {
    try {
      const data = await MockAPI.saveQuiz(quizData);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to save quiz');
    }
  }
);

export const deleteQuiz = createAsyncThunk(
  'quiz/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await MockAPI.deleteQuiz(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete quiz');
    }
  }
);

export const fetchQuizAnalytics = createAsyncThunk(
  'quiz/fetchAnalytics',
  async (quizId: string, { rejectWithValue }) => {
    try {
      const data = await MockAPI.getQuizAnalytics(quizId);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch quiz analytics');
    }
  }
);

export const fetchOverallAnalytics = createAsyncThunk(
  'quiz/fetchOverallAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await MockAPI.getOverallAnalytics();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch overall analytics');
    }
  }
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setCurrentQuiz: (state, action: PayloadAction<Quiz | null>) => {
      state.currentQuiz = action.payload;
    },
    clearQuizError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Quizzes
    builder.addCase(fetchQuizzes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuizzes.fulfilled, (state, action: PayloadAction<Quiz[]>) => {
      state.loading = false;
      state.quizzes = action.payload;
      state.error = null;
    });
    builder.addCase(fetchQuizzes.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch Quiz By ID
    builder.addCase(fetchQuizById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQuizById.fulfilled, (state, action: PayloadAction<Quiz>) => {
      state.loading = false;
      state.currentQuiz = action.payload;
      state.error = null;
    });
    builder.addCase(fetchQuizById.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Save Quiz
    builder.addCase(saveQuiz.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveQuiz.fulfilled, (state, action: PayloadAction<Quiz>) => {
      state.loading = false;
      const idx = state.quizzes.findIndex((q) => q.id === action.payload.id);
      if (idx !== -1) {
        state.quizzes[idx] = action.payload;
      } else {
        state.quizzes.push(action.payload);
      }
      state.currentQuiz = action.payload;
      state.error = null;
    });
    builder.addCase(saveQuiz.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Delete Quiz
    builder.addCase(deleteQuiz.fulfilled, (state, action: PayloadAction<string>) => {
      state.quizzes = state.quizzes.filter((q) => q.id !== action.payload);
      if (state.currentQuiz?.id === action.payload) {
        state.currentQuiz = null;
      }
    });

    // Fetch Quiz Analytics
    builder.addCase(fetchQuizAnalytics.fulfilled, (state, action: PayloadAction<any[]>) => {
      state.analytics = action.payload;
    });

    // Fetch Overall Analytics
    builder.addCase(fetchOverallAnalytics.fulfilled, (state, action: PayloadAction<any>) => {
      state.overallAnalytics = action.payload;
    });
  },
});

export const { setCurrentQuiz, clearQuizError } = quizSlice.actions;
export default quizSlice.reducer;
