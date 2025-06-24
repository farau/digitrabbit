// themes.js

export const lightTheme = {
  background: 'rgba(255, 255, 255, 0.85)',
  color: '#333',
  inputBg: '#fff',
  inputText: '#333',
};

export const darkTheme = {
  background: 'rgba(30, 30, 30, 0.9)',
  color: '#fff',
  inputBg: '#444',
  inputText: '#fff',
};


// Privy configuration for light and dark modes
export const lightModeConfig = {
  appearance: {
    theme: 'light',
    //logo: 'light-logo-url',
  },
};

export const darkModeConfig = {
  appearance: {
    theme: 'dark',
    //logo: 'dark-logo-url'
  }
};