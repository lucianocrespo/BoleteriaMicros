import { createBrowserRouter } from 'react-router-dom';
import Viajar from './components/Viajar';
import Horarios from './components/Horarios';
import Asientos from './components/Asientos';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Viajar />
  },
  {
    path: "/horarios",
    element: <Horarios />
  },
  {
    path: "/asientos",
    element: <Asientos />
  }
]);

export default router;