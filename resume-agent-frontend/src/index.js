// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// UPDATE THE IMPORT
import Home from './Home'; // Changed from './App'
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* UPDATE THE COMPONENT */}
    <Home /> {/* Changed from <App /> */}
  </React.StrictMode>
);

reportWebVitals();