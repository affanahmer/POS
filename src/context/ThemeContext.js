import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme types
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  LIGHT_ROOM: 'light_room',
  CUSTOM: 'custom',
};

// Default theme colors
const DEFAULT_THEMES = {
  light: {
    type: THEME_TYPES.LIGHT,
    colors: {
      primary: '#2196F3',
      secondary: '#FFC107',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#333333',
      textSecondary: '#666666',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
    },
  },
  dark: {
    type: THEME_TYPES.DARK,
    colors: {
      primary: '#2196F3',
      secondary: '#FFC107',
      background: '#121212',
      surface: '#1E1E1E',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      border: '#333333',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
    },
  },
  light_room: {
    type: THEME_TYPES.LIGHT_ROOM,
    colors: {
      primary: '#6A4C93',
      secondary: '#FFB3BA',
      background: '#FFF8F0',
      surface: '#F5F0E8',
      text: '#2C2C2C',
      textSecondary: '#6B6B6B',
      border: '#D4C4A8',
      success: '#7CB342',
      error: '#E57373',
      warning: '#FFB74D',
      info: '#64B5F6',
    },
  },
};

// Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEMES.light);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from AsyncStorage on app start
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@garmentpos_theme');
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setCurrentTheme(parsedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async theme => {
    try {
      await AsyncStorage.setItem('@garmentpos_theme', JSON.stringify(theme));
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (themeType, customColors = null) => {
    let newTheme;

    if (themeType === THEME_TYPES.CUSTOM && customColors) {
      newTheme = {
        type: THEME_TYPES.CUSTOM,
        colors: {
          ...DEFAULT_THEMES.light.colors,
          ...customColors,
        },
      };
    } else {
      newTheme = DEFAULT_THEMES[themeType] || DEFAULT_THEMES.light;
    }

    await saveTheme(newTheme);
  };

  const toggleDarkMode = async () => {
    const newThemeType =
      currentTheme.type === THEME_TYPES.DARK
        ? THEME_TYPES.LIGHT
        : THEME_TYPES.DARK;
    await setTheme(newThemeType);
  };

  const getThemeColors = () => currentTheme.colors;

  const isDarkMode = () => currentTheme.type === THEME_TYPES.DARK;

  const value = {
    currentTheme,
    setTheme,
    toggleDarkMode,
    getThemeColors,
    isDarkMode,
    isLoading,
    THEME_TYPES,
    DEFAULT_THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

