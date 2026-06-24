import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Renders UI wrapped with MemoryRouter and a fresh QueryClient per test.
 */
export function renderWithProviders(ui, { route = "/", queryClient, ...renderOptions } = {}) {
  const client = queryClient ?? createTestQueryClient();

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    queryClient: client,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export { createTestQueryClient };
