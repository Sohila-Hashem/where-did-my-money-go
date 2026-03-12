import { Outlet, createRootRoute } from "@tanstack/react-router";
import { CustomCategoriesProvider } from '@/hooks/use-custom-categories'
import { Toaster } from 'sonner'

export const Route = createRootRoute({
    component: () => (
        <CustomCategoriesProvider>
            <Outlet />
            <Toaster richColors position="top-center" />
        </CustomCategoriesProvider>
    ),
});
