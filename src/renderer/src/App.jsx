import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Main from './components/Main';
import ErrorPage from './components/ErrorPage';
import NewFrames from './components/NewFrames';
import AdjacentFrames from './components/AdjacentFrames';
import { Provider } from 'react-redux';
import { store } from './store';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/new-frames',
        element: <NewFrames />,
      },
      {
        path: '/adjacent-frames',
        element: <AdjacentFrames />,
      },
    ],
  },
]);

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
    // <RendererConfigFile />
  );
}

export default App;
