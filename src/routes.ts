import { createBrowserRouter } from 'react-router';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
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
import ProtectedRoute from './components/ProtectedRoute';
import About from './pages/About';
import Documentation from './pages/Documentation';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DashboardRedirect from './pages/DashboardRedirect';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: 'auth', Component: Auth },
      { path: 'verify-email', Component: VerifyEmail },
      { path: 'sso-callback', Component: AuthenticateWithRedirectCallback },
      { path: 'dashboard', Component: DashboardRedirect },
      { path: 'marketplace', Component: Marketplace },
      { path: 'batch/:batchId', Component: BatchDetail },
      { path: 'about', Component: About },
      { path: 'docs', Component: Documentation },
      { path: 'contact', Component: Contact },
      { path: 'terms', Component: Terms },
      { path: 'privacy', Component: Privacy },
      {
        Component: ProtectedRoute,
        children: [
          { path: 'producer-dashboard', Component: ProducerDashboard },
          { path: 'submit-batch', Component: SubmitBatch },
          { path: 'buyer-dashboard', Component: BuyerDashboard },
          { path: 'retire', Component: Retire },
        ],
      },
      { path: '*', Component: NotFound },
    ],
  },
]);