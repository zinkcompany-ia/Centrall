import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/dm-mono/latin-500.css";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

// networkMode "always": os dados são locais, então tudo deve funcionar mesmo sem internet.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, refetchOnWindowFocus: false, networkMode: "always" },
    mutations: { networkMode: "always" },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" switchable>
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
