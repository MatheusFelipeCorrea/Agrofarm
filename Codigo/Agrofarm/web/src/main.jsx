import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { appQueryClient } from "./lib/queryClient.js";
import "./styles/globals.css";
import App from "./App.jsx";

const queryClient = appQueryClient;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-center"
        richColors
        closeButton
        expand={false}
        gap={10}
        toastOptions={{
          classNames: {
            toast: "agro-toast",
            title: "agro-toast-title",
            description: "agro-toast-desc",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);