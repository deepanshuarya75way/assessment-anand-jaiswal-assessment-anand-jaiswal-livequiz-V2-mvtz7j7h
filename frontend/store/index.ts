import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import quizReducer from './quizSlice';
import leaderboardReducer from './leaderboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quiz: quizReducer,
    leaderboard: leaderboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off for simpler mock interactions if needed
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
