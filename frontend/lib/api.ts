import { io } from 'socket.io-client';

/**
 * Mock API Database Service
 * Simulates a backend server using localStorage and BroadcastChannel.
 * Implements JWT authentication (access & refresh tokens), Quiz CRUD, and Real-time Play.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  timeLimit: number; // in seconds
  pointsWeight: number; // multiplier, e.g., 1 or 2
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  questions: Question[];
  createdAt: string;
  isPublished: boolean;
  joinCode?: string; // 6-digit code when published
}

export interface Player {
  id: string;
  nickname: string;
  joinedAt: string;
  score: number;
  answers: {
    questionIndex: number;
    selectedOptionIndex: number;
    isCorrect: boolean;
    pointsScored: number;
    timeTaken: number;
  }[];
}

export interface QuizSession {
  code: string;
  quizId: string;
  quizTitle: string;
  creatorId: string;
  isActive: boolean;
  players: { [playerId: string]: Player };
  currentQuestionIndex: number; // -1: waiting, >=0: active question, questions.length: completed
  status: 'waiting' | 'active' | 'completed';
  startedAt?: string;
}

// Custom simple Base64 encoder/decoder for browser environments
function base64UrlEncode(obj: object): string {
  const str = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): any {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decodedStr = new TextDecoder().decode(bytes);
  return JSON.parse(decodedStr);
}

// Generate a simple Mock JWT
function signMockJwt(payload: any, expiresInSeconds: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(fullPayload);
  const signature = btoa(encodedHeader + '.' + encodedPayload).substring(0, 16); // mock signature
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify a Mock JWT
function verifyMockJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    
    const payload = base64UrlDecode(parts[1]);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    if (payload.exp && currentTimestamp > payload.exp) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Invalid token');
  }
}

// Helpers for localStorage persistence
const DB = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem('ll_users') || '[]'),
  setUsers: (users: User[]) => localStorage.setItem('ll_users', JSON.stringify(users)),
  
  getQuizzes: (): Quiz[] => JSON.parse(localStorage.getItem('ll_quizzes') || '[]'),
  setQuizzes: (quizzes: Quiz[]) => localStorage.setItem('ll_quizzes', JSON.stringify(quizzes)),
  
  getSessions: (): { [code: string]: QuizSession } => 
    JSON.parse(localStorage.getItem('ll_sessions') || '{}'),
  setSessions: (sessions: { [code: string]: QuizSession }) => 
    localStorage.setItem('ll_sessions', JSON.stringify(sessions)),
    
  getCurrentUser: (): any => {
    const token = localStorage.getItem('ll_access_token');
    if (!token) return null;
    try {
      return verifyMockJwt(token);
    } catch {
      return null;
    }
  }
};

// Initialize Socket.io Client for real-time WebSocket updates
let socket: any = null;
if (typeof window !== 'undefined') {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  socket = io(backendUrl, {
    transports: ['websocket'],
    autoConnect: true,
  });
  
  socket.on('connect', () => {
    console.log('[Socket] Connected to backend websocket!');
  });
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }
}

function deleteCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function broadcastUpdate(type: string, data: any) {
  // No-op: all sync events are now routed via backend Socket.io rooms
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000') + '/api/v1';

export const MockAPI = {
  // --- AUTHENTICATION API ---
  
  async register(username: string, email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: { accessToken: string; refreshToken: string } }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    
    localStorage.setItem('ll_access_token', data.tokens.accessToken);
    localStorage.setItem('ll_refresh_token', data.tokens.refreshToken);
    setCookie('ll_access_token', data.tokens.accessToken, 15 * 60);
    setCookie('ll_refresh_token', data.tokens.refreshToken, 7 * 24 * 3600);
    
    return data;
  },

  async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: { accessToken: string; refreshToken: string } }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }
    
    localStorage.setItem('ll_access_token', data.tokens.accessToken);
    localStorage.setItem('ll_refresh_token', data.tokens.refreshToken);
    setCookie('ll_access_token', data.tokens.accessToken, 15 * 60);
    setCookie('ll_refresh_token', data.tokens.refreshToken, 7 * 24 * 3600);
    
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('ll_refresh_token');
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error('Logout API failed:', err);
      }
    }
    localStorage.removeItem('ll_access_token');
    localStorage.removeItem('ll_refresh_token');
    deleteCookie('ll_access_token');
    deleteCookie('ll_refresh_token');
  },

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Session expired or invalid refresh token.');
    }
    
    localStorage.setItem('ll_access_token', data.accessToken);
    localStorage.setItem('ll_refresh_token', data.refreshToken);
    setCookie('ll_access_token', data.accessToken, 15 * 60);
    setCookie('ll_refresh_token', data.refreshToken, 7 * 24 * 3600);
    
    return data;
  },

  getCurrentUser(): Omit<User, 'passwordHash'> | null {
    const payload = DB.getCurrentUser();
    if (!payload) return null;
    return {
      id: payload.userId,
      username: payload.username,
      email: payload.email,
    };
  },

  async signupSendOtp(username: string, email: string, password: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/signup/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send verification OTP.');
    }
    return data;
  },

  async signupVerify(username: string, email: string, password: string, otp: string): Promise<{ user: Omit<User, 'passwordHash'>; tokens: { accessToken: string; refreshToken: string } }> {
    const res = await fetch(`${API_BASE_URL}/auth/signup/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed.');
    }
    localStorage.setItem('ll_access_token', data.tokens.accessToken);
    localStorage.setItem('ll_refresh_token', data.tokens.refreshToken);
    setCookie('ll_access_token', data.tokens.accessToken, 15 * 60);
    setCookie('ll_refresh_token', data.tokens.refreshToken, 7 * 24 * 3600);
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to request password reset.');
    }
    return data;
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password.');
    }
    return data;
  },

  async forgotEmail(username: string): Promise<{ email: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to recover email.');
    }
    return data;
  },

  async forgotUsername(email: string): Promise<{ username: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to recover username.');
    }
    return data;
  },



  // --- QUIZ MANAGEMENT API ---

  async getQuizzes(): Promise<Quiz[]> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/quizzes`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch quizzes');
    
    return data.map((q: any) => ({
      ...q,
      id: q._id,
    }));
  },

  async getQuizById(id: string): Promise<Quiz> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch quiz details');
    
    return {
      ...data,
      id: data._id,
    };
  },

  async getQuizByJoinCode(code: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/quizzes/join/${code}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch quiz details');
    
    return {
      ...data,
      id: data._id,
    };
  },

  async saveQuiz(quizData: Omit<Quiz, 'creatorId' | 'createdAt'> & { id?: string }): Promise<Quiz> {
    const accessToken = localStorage.getItem('ll_access_token');
    const isUpdate = !!quizData.id;
    const url = isUpdate ? `${API_BASE_URL}/quizzes/${quizData.id}` : `${API_BASE_URL}/quizzes`;
    
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quizData),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save quiz');
    
    return {
      ...data,
      id: data._id,
    };
  },

  async deleteQuiz(id: string): Promise<void> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete quiz');
  },

  // --- LIVE QUIZ SESSIONS API (HOST & PARTICIPANT) ---

  async publishQuiz(quizId: string): Promise<string> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish quiz');
    
    const code = data.code;
    broadcastUpdate('SESSION_CREATED', { code });
    return code;
  },

  async getSession(code: string): Promise<QuizSession> {
    const res = await fetch(`${API_BASE_URL}/sessions/${code}`);
    const session = await res.json();
    if (!res.ok) throw new Error(session.error || 'Quiz session not found or inactive.');
    return session;
  },

  async joinSession(code: string, nickname: string): Promise<{ playerId: string; session: QuizSession; quiz: Omit<Quiz, 'questions'> & { questions: Omit<Question, 'correctOptionIndex'>[] } }> {
    const res = await fetch(`${API_BASE_URL}/sessions/${code}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join quiz session.');
    
    broadcastUpdate('PLAYER_JOINED', { code, playerId: data.playerId, nickname, score: 0 });
    return data;
  },

  async submitAnswer(code: string, playerId: string, questionIndex: number, selectedOptionIndex: number, timeRemainingMs: number): Promise<{ isCorrect: boolean; pointsScored: number; totalScore: number }> {
    const res = await fetch(`${API_BASE_URL}/sessions/${code}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerId, questionIndex, selectedOptionIndex, timeRemainingMs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit answer.');
    
    broadcastUpdate('ANSWER_SUBMITTED', {
      code,
      playerId,
      questionIndex,
      pointsScored: data.pointsScored,
      isCorrect: data.isCorrect,
    });
    
    return data;
  },

  async nextQuestion(code: string): Promise<QuizSession> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/sessions/${code}/next`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to advance question.');
    
    broadcastUpdate('QUESTION_CHANGED', {
      code,
      currentQuestionIndex: data.currentQuestionIndex,
      status: data.status,
    });
    
    return data;
  },

  async endSession(code: string): Promise<QuizSession> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/sessions/${code}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to end session.');
    
    broadcastUpdate('SESSION_ENDED', { code });
    return data;
  },

  async abandonSession(code: string): Promise<any> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/sessions/${code}/abandon`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to destroy session.');
    return data;
  },

  // --- ANALYTICS DATABASE ---
  
  async getQuizAnalytics(quizId: string): Promise<any[]> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/analytics/quiz/${quizId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch quiz analytics.');
    return data;
  },

  async getOverallAnalytics(): Promise<{ totalPlays: number; avgParticipants: number; quizzesStats: any[] }> {
    const accessToken = localStorage.getItem('ll_access_token');
    const res = await fetch(`${API_BASE_URL}/analytics/overall`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch overall analytics.');
    return data;
  },

  // Listen for real-time live events on pages via WebSockets
  subscribeToSessionUpdates(code: string, callback: (event: any) => void): () => void {
    if (typeof window === 'undefined' || !socket) return () => {};
    
    // Join the session socket room
    socket.emit('joinRoom', code);
    
    // Listen for events from the server
    const handleSessionEvent = (event: any) => {
      if (event && event.code === code) {
        callback(event);
      }
    };
    
    socket.on('session_event', handleSessionEvent);
    
    return () => {
      socket.off('session_event', handleSessionEvent);
    };
  }
};
