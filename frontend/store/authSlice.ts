import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MockAPI, User } from '@/lib/api';

interface AuthState {
  user: Omit<User, 'passwordHash'> | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: any, { rejectWithValue }) => {
    try {
      const response = await MockAPI.login(email, password);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }: any, { rejectWithValue }) => {
    try {
      const response = await MockAPI.register(username, email, password);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

export const registerUserWithOtp = createAsyncThunk(
  'auth/registerWithOtp',
  async ({ username, email, password, otp }: any, { rejectWithValue }) => {
    try {
      const response = await MockAPI.signupVerify(username, email, password, otp);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Verification failed');
    }
  }
);

export const refreshSessionToken = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string, { rejectWithValue }) => {
    try {
      const response = await MockAPI.refreshAccessToken(refreshToken);
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Session expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser: (state) => {
      MockAPI.logout();
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    initializeAuth: (state) => {
      if (typeof window !== 'undefined') {
        const user = MockAPI.getCurrentUser();
        const access = localStorage.getItem('ll_access_token');
        const refresh = localStorage.getItem('ll_refresh_token');
        if (user && access && refresh) {
          state.user = user;
          state.accessToken = access;
          state.refreshToken = refresh;
          state.isAuthenticated = true;
        }
      }
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Register with OTP
    builder.addCase(registerUserWithOtp.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUserWithOtp.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(registerUserWithOtp.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Refresh Token
    builder.addCase(refreshSessionToken.fulfilled, (state, action: PayloadAction<any>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    });
    builder.addCase(refreshSessionToken.rejected, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    });
  },
});

export const { logoutUser, initializeAuth, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
