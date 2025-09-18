import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  REFRESH_TOKEN: 'REFRESH_TOKEN'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Set up axios interceptor for token
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check token validity on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token && !state.user) {
        try {
          const response = await api.get('/api/auth/profile');
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token: state.token
            }
          });
        } catch (error) {
          // Token is invalid, logout
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          navigate('/login');
        }
      }
    };

    checkAuth();
  }, [state.token, state.user, navigate]);

  // Login function
  // const login = async (credentials) => {
  //   dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
  //   try {
  //     const response = await api.post('/api/auth/login', credentials);
      
  //     dispatch({
  //       type: AUTH_ACTIONS.LOGIN_SUCCESS,
  //       payload: response.data
  //     });

  //     // Redirect to dashboard; it will route by role
  //     navigate('/dashboard');

  //     toast.success('Login successful!');
      
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.error || 'Login failed';
  //     dispatch({
  //       type: AUTH_ACTIONS.LOGIN_FAILURE,
  //       payload: errorMessage
  //     });
      
  //     toast.error(errorMessage);
  //     throw error;
  //   }
  // };
  // Login function
const login = async (credentials) => {
  dispatch({ type: AUTH_ACTIONS.LOGIN_START });

  try {
    const response = await api.post('/api/auth/login', credentials);

    dispatch({
      type: AUTH_ACTIONS.LOGIN_SUCCESS,
      payload: response.data
    });

    // 👉 Just return response data
    return response.data;

  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Login failed';
    dispatch({
      type: AUTH_ACTIONS.LOGIN_FAILURE,
      payload: errorMessage
    });

    throw error;
  }
};


  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await api.post('/api/auth/register', userData);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: response.data
      });

      // Redirect to dashboard; it will route by role
      navigate('/dashboard');

      toast.success('Registration successful!');
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.token) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: response.data.user
      });

      toast.success('Profile updated successfully');
      return response.data.user;
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      await api.post('/api/auth/change-password', passwordData);
      toast.success('Password changed successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await api.post('/api/auth/refresh-token');
      
      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: response.data.token
      });

      return response.data.token;
      
    } catch (error) {
      // Token refresh failed, logout user
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      navigate('/login');
      toast.error('Session expired. Please login again.');
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;


