import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import "./config/axios";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./hooks/useAuth";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { authentication: undefined! },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});


function App() {
  const authentication = useAuth();
  return <RouterProvider router={router} context={{ authentication }} />;
}
// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
                    <App />
                </ThemeProvider>
            </QueryClientProvider>
        </StrictMode>
    );
}
