import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Under a subpath the browser's pathname is /volta/products while the
        routes are declared as /products. basename is what reconciles the two;
        without it every route 404s on GitHub Pages. import.meta.env.BASE_URL is
        whatever Vite was built with, so this is correct on both hosts. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
