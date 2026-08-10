import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectContext } from './context/conectionContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConnectContext>
      <App />
    </ConnectContext>
  </StrictMode>,
)
