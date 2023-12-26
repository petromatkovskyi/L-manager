import React from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import ReactDOM from 'react-dom/client'
import { extendTheme, CssVarsProvider } from '@mui/joy/styles'

import App from './App'
import theme from './materialUI/extendTheme'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
  <Provider store={store}>
    <App />
  </Provider>
  // </React.StrictMode>
)
