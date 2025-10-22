"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: dados ficam "fresh" por 5 minutos
            staleTime: 1000 * 60 * 5,
            // Cache time: dados permanecem no cache por 10 minutos
            gcTime: 1000 * 60 * 10,
            // Refetch quando janela ganha foco
            refetchOnWindowFocus: true,
            // Refetch ao reconectar internet
            refetchOnReconnect: true,
            // Retry 2x em caso de falha
            retry: 2,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
