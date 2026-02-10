
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for debugging GitHub Pages issues
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, error);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="color: white; padding: 20px; font-family: monospace;">
      <h2>Critical Startup Error</h2>
      <p>${message}</p>
      <p>Check console for details.</p>
    </div>`;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
