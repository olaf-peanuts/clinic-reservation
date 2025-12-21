import { ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-green-800 text-white p-4">
        <h1 className="text-2xl font-bold">診療予約システム</h1>
      </header>

      <main className="flex-1 p-6">{children ?? <Outlet />}</main>

      <footer className="bg-gray-100 text-center py-2">
        © 2025 Company Clinic
      </footer>
    </div>
  );
}
