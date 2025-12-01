// client/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import BecomeHost from "./pages/BecomeHost";
import Checkout from "./pages/Checkout";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyForm from "./pages/PropertyForm";
import SearchPage from "./pages/SearchPage";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/not-found";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home pubblica: guest vede direttamente gli immobili */}
        <Route path="/" element={<HomePage />} />

        {/* Dashboard dopo login, se ti serve */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Area admin */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Flusso host */}
        <Route path="/host/become" element={<BecomeHost />} />
        <Route path="/host/properties/new" element={<PropertyForm />} />

        {/* Dettaglio immobile */}
        <Route path="/property/:id" element={<PropertyDetail />} />

        {/* Ricerca / filtri */}
        <Route path="/search" element={<SearchPage />} />

        {/* Pagamento / checkout */}
        <Route path="/checkout" element={<Checkout />} />

        {/* Profilo utente */}
        <Route path="/profile" element={<UserProfile />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
