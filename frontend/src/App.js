import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from './context/AuthContext'  // or correct path
import Navbar from "./components/navbar"
import Home from "./pages/home"
import About from "./pages/about"
import Contact from "./pages/contact"
import Help from "./pages/help"
import Login from "./pages/login"
import PPEDetection from "./pages/ppedetection"
import Dashboard from "./pages/dashboard"
import AdminDashboard from "./pages/admindashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"
import ViewViolation from "./pages/viewViolation"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/ppe-detection"
              element={
                <ProtectedRoute>
                  <PPEDetection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admindashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
  path="/admin/users/:userId/violations"
  element={
    <ProtectedRoute>
      <ViewViolation />
    </ProtectedRoute>
  }
/>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App