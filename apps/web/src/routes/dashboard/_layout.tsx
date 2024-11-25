import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import BasicLayout from '@/components/common/BasicLayout';
import DashboardTab from '@/components/dashboard/DashboardTab';
import Header from '@/components/common/Header';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
  beforeLoad: () => {
    if (window.location.pathname === '/dashboard') {
      throw redirect({
        to: '/dashboard/apply',
      });
    }
  },
});

function RouteComponent() {
  return (
    <>
      <Header />
      <BasicLayout className="px-[7.5rem]">
        <div className="w-full">
          <DashboardTab />
        </div>
        <Outlet />
      </BasicLayout>
    </>
  );
}
