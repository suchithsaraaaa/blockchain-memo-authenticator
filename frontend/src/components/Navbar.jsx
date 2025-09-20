import { Link, useLocation } from "react-router-dom"
import { Shield, Upload, Search, Users, BarChart3 } from "lucide-react"

const Navbar = () => {
  const location = useLocation()

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/upload", label: "Upload Memo", icon: Upload },
    { path: "/verify", label: "Verify Hash", icon: Search },
    { path: "/students", label: "Students", icon: Users },
  ]

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Blockchain Memo Authenticator</span>
          </div>

          <div className="flex space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  location.pathname === path
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
