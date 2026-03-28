import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Anomalies from './pages/Anomalies'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text-primary font-sans">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/anomalies" element={<Anomalies />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  </React.StrictMode>
)
