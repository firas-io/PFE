import './habitflow.css';
import { DashboardShell } from './_components/DashboardShell';
import { ToastProvider } from '@/components/Toast';

export default function DashboardLayout({ children }) {
  return (
    <ToastProvider>
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
