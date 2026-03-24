import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { SessionProvider } from './context/SessionContext'
import { EmergencyProvider } from './context/EmergencyContext'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <EmergencyProvider>
        <SessionProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SessionProvider>
      </EmergencyProvider>
    </BrowserRouter>
  </React.StrictMode>
)
