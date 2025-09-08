import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages";
import AdminApprovals from "./pages/approve";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/approve" element={<AdminApprovals />} />
      </Routes>
    </BrowserRouter>
  );
}
