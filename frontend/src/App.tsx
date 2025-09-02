import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import AdminDashboard from './pages/AdminDashboard';
import AdminSetup from './pages/AdminSetup';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#fff6dd',
      paper: '#ffffff',
    },
    primary: {
      main: '#1f2a44',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2b3b6c',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#1f2a44',
    },
    divider: '#f3e6bb'
  },
  shape: {
    borderRadius: 10,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Standalone Auth Pages - No Navbar */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin-setup" element={<AdminSetup />} />
              
              {/* Main App with Navbar */}
              <Route path="/*" element={
                <div className="min-h-screen bg-padma-cream">
                  <Navbar />
                  <main className="pt-16">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/add-product" element={<AddProduct />} />
                      <Route path="/edit-product/:productId" element={<EditProduct />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/orders" element={<Orders />} />
                    </Routes>
                  </main>
                </div>
              } />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
