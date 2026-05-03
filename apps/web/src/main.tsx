import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@lunedoc/ui/tokens.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
