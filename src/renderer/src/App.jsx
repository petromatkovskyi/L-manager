import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Main from './components/Main'
import ErrorPage from './components/ErrorPage'
import NewFrames from './components/NewFrames'
import AdjacentFrames from './components/AdjacentFrames'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { fetchTakenFrames } from './store/framesSlice'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/new-frames',
        element: <NewFrames />
      },
      {
        path: '/adjacent-frames',
        element: <AdjacentFrames />
      }
    ]
  }
])

function App() {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchTakenFrames())
  }, [])

  return (
    <RouterProvider router={router} />
    // <RendererConfigFile />
  )
}

export default App
