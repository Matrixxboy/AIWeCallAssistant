// MainPage.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import ChatPage from "./ChatPage";
import CallingPage from "./CallingPage";
import ChatHistoryPage from "./ChatHistoryPage";
import ProfilePage from "./ProfilePage";

import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";

function MainPage() {
  const [currentPage, setCurrentPage] = useState("chat");

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex flex-col h-screen bg-background text-foreground">
          {/* Navbar */}
          <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />

          {/* Main Content */}
          <main className="flex-grow overflow-y-auto">
            <Routes>
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/calling" element={<CallingPage />} />
              <Route path="/history" element={<ChatHistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Default Redirect */}
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MainPage;
