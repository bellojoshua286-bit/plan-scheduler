import { createContext, useContext, useState } from 'react'

export const THEMES = {
  Default: {
    name: 'Default',
    primary:      '#5B4FE9',
    primaryLight: '#EEF0FF',
  },
  Ocean: {
    name: 'Ocean',
    primary:      '#0077B6',
    primaryLight: '#CAF0F8',
  },
  Forest: {
    name: 'Forest',
    primary:      '#2D6A4F',
    primaryLight: '#D8F3DC',
  },
  Sunset: {
    name: 'Sunset',
    primary:      '#E85D04',
    primaryLight: '#FFEDD5',
  },
  PurpleDusk: {
    name: 'Purple Dusk',
    primary:      '#7B2FBE',
    primaryLight: '#EDE7F6',
  },
  Midnight: {
    name: 'Midnight',
    primary:      '#1A1A2E',
    primaryLight: '#E8E8F0',
  },
}

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark,        setDark]        = useState(false)
  const [activeTheme, setActiveTheme] = useState('Default')

  const palette = THEMES[activeTheme] || THEMES.Default

  const theme = {
    dark,
    toggle:          () => setDark(d => !d),
    activeTheme,
    setActiveTheme,
    primary:         palette.primary,
    primaryLight:    palette.primaryLight,
    colors: {
      bg:     dark ? '#1A1A2E' : '#F4F6FF',
      card:   dark ? '#16213E' : '#FFFFFF',
      text:   dark ? '#F8F9FA' : '#1A1A2E',
      muted:  dark ? '#94A3B8' : '#64748B',
      border: dark ? '#0F3460' : '#E2E8F0',
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)