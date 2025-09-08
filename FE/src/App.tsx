import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages";
import AdminApprovals from "./pages/approve";
import { ThemeProvider } from "./components/theme-provider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/approve" element={<AdminApprovals />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
