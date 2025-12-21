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
import { api } from '@/api/client';

console.log('App starting');

// 画面サイズ設定を読み込む
const loadScreenSize = async () => {
  try {
    const res = await api.get('/config/screen-size').catch(() => ({ data: null }));
    if (res.data?.minScreenWidth && res.data?.minScreenHeight) {
      const minWidth = res.data.minScreenWidth;
      const minHeight = res.data.minScreenHeight;
      
      // CSS変数で最小幅・最小高さを設定
      document.documentElement.style.setProperty('--min-screen-width', `${minWidth}px`);
      document.documentElement.style.setProperty('--min-screen-height', `${minHeight}px`);
    }
  } catch (err) {
    console.error('Error loading screen size:', err);
  }
};

// アプリケーション起動時に画面サイズを読み込む
loadScreenSize();

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

