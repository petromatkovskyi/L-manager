import React from 'react';
import ReactDOM from 'react-dom/client';
import { extendTheme, CssVarsProvider } from '@mui/joy/styles';

import App from './App';
import theme from './materialUI/extendTheme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
  <App />
  // </React.StrictMode>
);
