// Light or dark, remembered in the browser. A blocked localStorage must not crash the page.
const KEY = 'sl-theme'

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Private mode can throw. Fall through to the OS preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // The choice still applies for this visit.
  }
}

export function applyStoredTheme() {
  document.documentElement.dataset.theme = getTheme()
}
