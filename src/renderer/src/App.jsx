// App.jsx

import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Main from './components/Main'
import ErrorPage from './components/ErrorPage'
import NewFrames from './components/NewFrames'
import AdjacentFrames from './components/AdjacentFrames'
import { useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { fetchTakenFrames } from './store/framesSlice'
import CheckingFrames from './components/CheckingFrames'

function App() {
  const [router, setRouter] = useState(null)
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchTakenFrames())
  }, [])

  useEffect(() => {
    ;(async function () {
      const currLocation = await window.electronApi.getCurrLocation()
      const encodedURI = currLocation
        .split('')
        .map((char) => {
          if (/[а-яА-ЯіІ\s]/.test(char)) {
            return char === ' ' ? '%20' : encodeURIComponent(char)
          } else {
            return char
          }
        })
        .join('')
        .replaceAll('\\', '/')

      const routers = createBrowserRouter(
        [
          {
            path: '/',
            element: <Main />,
            errorElement: <ErrorPage />,
            children: [
              {
                index: true,
                // path: 'new-frames',
                element: <NewFrames />
              },
              {
                path: 'adjacent-frames',
                element: <AdjacentFrames />
              },
              {
                path: 'checking-frames',
                element: <CheckingFrames />
              }
            ]
          }
        ],
        {
          basename: currLocation !== 'http://localhost:5173' ? `/${encodedURI}` : '/'
        }
      )
      setRouter(routers)
    })()
  }, [])
  return router ? <RouterProvider router={router} /> : ''
}

export default App
