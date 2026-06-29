import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Production with Lemma
// import App from './App.dev' // Development mode (Lemma auth unavailable)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
