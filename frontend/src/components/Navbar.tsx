import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Badge,
  IconButton,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { state } = useCart();
  const { isAdmin, isAuthenticated, user, logout } = useAuth();
  console.log('Navbar - isAdmin:', isAdmin, 'user:', user);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const cartItemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ backgroundColor: 'var(--padma-cream)', borderBottom: '1px solid var(--padma-cream-strong)' }}>
      <Toolbar>
        {/* Company Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <StoreIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Padmavati
          </Typography>
        </Link>

        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
          <Link to="/">
            <Button color="inherit" sx={{ fontWeight: 700, color: 'text.primary', '&:hover': { background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)', color: 'var(--padma-cream)' } }}>Home</Button>
          </Link>
          <Link to="/products">
            <Button color="inherit" sx={{ fontWeight: 700, color: 'text.primary', '&:hover': { background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)', color: 'var(--padma-cream)' } }}>Products</Button>
          </Link>
        </Box>

        {/* Action Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Admin Icons - Only show for admin users */}
          {isAdmin === true ? (
            <>
              <Tooltip title="Admin Dashboard">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigate('/admin')} 
                  aria-label="admin dashboard" 
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { 
                      background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)', 
                      color: 'var(--padma-cream)' 
                    } 
                  }}
                >
                  <AdminPanelSettings />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add New Product">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigate('/add-product')} 
                  aria-label="add product" 
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { 
                      background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)', 
                      color: 'var(--padma-cream)' 
                    } 
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            // This is a debug button that will only show when isAdmin is false
            // It helps us verify that the component is rendering correctly
            user && user.role === 'admin' && (
              <Tooltip title="Debug: Admin Icon (Role is admin but isAdmin is false)">
                <IconButton 
                  color="secondary" 
                  onClick={() => {
                    console.log('Debug - User role:', user.role, 'isAdmin state:', isAdmin);
                    navigate('/admin');
                  }} 
                  aria-label="debug admin" 
                  sx={{ 
                    color: 'error.main',
                    border: '2px dashed red'
                  }}
                >
                  <AdminPanelSettings />
                </IconButton>
              </Tooltip>
            )
          )}

          {/* Shopping Cart Icon */}
          <Tooltip title="Shopping Cart">
            <IconButton color="inherit" onClick={() => navigate('/cart')} aria-label="cart" sx={{ color: 'primary.main', '&:hover': { background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)', color: 'var(--padma-cream)' } }}>
              <Badge badgeContent={cartItemCount} color="secondary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Logo/Avatar */}
          <Tooltip title="User Account">
            <IconButton onClick={handleMenu} aria-label="account">
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <PersonIcon sx={{ fontSize: 18 }} />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {isAuthenticated ? [
            <MenuItem key="user-info" onClick={handleClose}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.name} ({user?.role})
              </Typography>
            </MenuItem>,
            <MenuItem key="profile" onClick={() => { handleClose(); navigate('/profile'); }}>
              Profile
            </MenuItem>,
            <MenuItem key="orders" onClick={() => { handleClose(); navigate('/orders'); }}>
              My Orders
            </MenuItem>,
            <MenuItem key="settings" onClick={handleClose}>Settings</MenuItem>,
            <MenuItem key="logout" onClick={() => { handleClose(); logout(); }}>Logout</MenuItem>
          ] : [
            <MenuItem key="login" onClick={() => { handleClose(); navigate('/login'); }}>Login</MenuItem>,
            <MenuItem key="register" onClick={() => { handleClose(); navigate('/register'); }}>Register</MenuItem>
          ]}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
