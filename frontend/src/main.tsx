import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

// Environment variable validation
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.warn(
    '⚠️ VITE_API_URL is not defined. API calls will default to /api. ' +
    'Ensure this variable is set at BUILD-TIME in your deployment environment.'
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
