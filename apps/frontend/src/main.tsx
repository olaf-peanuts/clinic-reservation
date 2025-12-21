import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';
import './index.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ReservationScheduler from '@/pages/ReservationScheduler';
import TemplateList from '@/pages/TemplateList';

console.log('App starting');

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="reservations" element={<ReservationScheduler />} />
          <Route path="templates" element={<TemplateList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>,
);

