import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ReservationView from './pages/ReservationView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* アプリ起動時に予約一覧画面を表示 */}
        <Route path="/*" element={<ReservationView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
