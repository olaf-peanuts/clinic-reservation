import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

export default function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="w-full flex flex-col min-h-screen">
      <header className="bg-green-800 text-white p-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">診療予約システム</h1>
      </header>

      <main className="flex-1 p-6 w-full overflow-auto">{children ?? <Outlet />}</main>

      <footer className="bg-gray-100 text-center py-2 flex-shrink-0 w-full">
        © 2025 Company Clinic
      </footer>
    </div>
  );
}
