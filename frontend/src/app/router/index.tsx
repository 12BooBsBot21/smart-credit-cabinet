import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/login'
import { ClientHomePage } from '@/pages/client-home'
import { NewApplicationPage } from '@/pages/new-application'
import { ClientApplicationPage } from '@/pages/client-application'
import { BankQueuePage } from '@/pages/bank-queue'
import { BankApplicationPage } from '@/pages/bank-application'
import { BankDashboardPage } from '@/pages/bank-dashboard'
import { TaskMapPage } from '@/pages/task-map'
import { AppLayout } from '@/widgets/app-layout'
import { HomeRedirect, RequireRole } from './guards'

export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },
  { path: '/login', element: <LoginPage /> },
  // Карта задач открыта без входа — её смотрит вся команда
  { path: '/map', element: <TaskMapPage /> },
  {
    element: <RequireRole role="CLIENT" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/client', element: <ClientHomePage /> },
          { path: '/client/applications/new', element: <NewApplicationPage /> },
          { path: '/client/applications/:id', element: <ClientApplicationPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireRole role="UNDERWRITER" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/bank', element: <BankQueuePage /> },
          { path: '/bank/dashboard', element: <BankDashboardPage /> },
          { path: '/bank/applications/:id', element: <BankApplicationPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
