import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Upload from "./pages/Upload"
import Verify from "./pages/Verify"
import Students from "./pages/Students"
import Dashboard from "./pages/Dashboard"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/students" element={<Students />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
