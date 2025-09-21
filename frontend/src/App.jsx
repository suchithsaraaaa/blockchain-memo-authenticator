import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import Upload from "./pages/Upload"
import Verify from "./pages/Verify"
import Students from "./pages/Students"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"
import { isAuthenticated } from "./lib/api"

function App() {
  const [authed, setAuthed] = useState(isAuthenticated())

  useEffect(() => {
    const onAuthChanged = () => setAuthed(isAuthenticated())
    window.addEventListener("auth-changed", onAuthChanged)
    return () => window.removeEventListener("auth-changed", onAuthChanged)
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {authed && <Navbar />}
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public (only when not authenticated) */}
            <Route path="/login" element={authed ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={authed ? <Navigate to="/" /> : <Register />} />

            {/* Protected */}
            <Route path="/" element={authed ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/upload" element={authed ? <Upload /> : <Navigate to="/login" />} />
            <Route path="/verify" element={authed ? <Verify /> : <Navigate to="/login" />} />
            <Route path="/students" element={authed ? <Students /> : <Navigate to="/login" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={authed ? "/" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
