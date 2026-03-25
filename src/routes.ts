import { createBrowserRouter } from 'react-router';
import Root from './pages/Root';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ProducerDashboard from './pages/ProducerDashboard';
import SubmitBatch from './pages/SubmitBatch';
import Marketplace from './pages/Marketplace';
import BatchDetail from './pages/BatchDetail';
import BuyerDashboard from './pages/BuyerDashboard';
import Retire from './pages/Retire';
import NotFound from './pages/NotFound';
import VerifyEmail from './pages/verifyEmail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: 'auth', Component: Auth },
      { path: 'verify-email', Component: VerifyEmail },
      { path: 'producer-dashboard', Component: ProducerDashboard },
      { path: 'submit-batch', Component: SubmitBatch },
      { path: 'marketplace', Component: Marketplace },
      { path: 'batch/:batchId', Component: BatchDetail },
      { path: 'buyer-dashboard', Component: BuyerDashboard },
      { path: 'retire', Component: Retire },
      { path: '*', Component: NotFound },
    ],
  },
]);