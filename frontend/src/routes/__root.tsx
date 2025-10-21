import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ResponsiveNavigation } from '../components/navigation/ResponsiveNavigation';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { FloatingActionButton } from '../components/navigation/FloatingActionButton';

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="min-h-screen bg-gradient-dark text-white">
        <ResponsiveNavigation />
        
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        
        <BottomNavigation />
        <FloatingActionButton />
      </div>
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
