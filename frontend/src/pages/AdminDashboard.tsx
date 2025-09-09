import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AdminPanelSettings as AdminIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { productAPI, userAPI, orderAPI } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/products');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, usersRes, ordersRes] = await Promise.all([
        productAPI.getAllProducts(),
        userAPI.getAllUsers(),
        orderAPI.getAllOrders(),
      ]);

      setProducts(productsRes.data.products || []);
      setUsers(usersRes.data.users || []);
      setOrders(ordersRes.data.orders || []);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error loading data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.deleteProduct(productId);
        setSnackbar({
          open: true,
          message: 'Product deleted successfully',
          severity: 'success',
        });
        loadData();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error deleting product',
          severity: 'error',
        });
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete any pending orders associated with this user.')) {
      try {
        await userAPI.deleteUser(userId);
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success',
        });
        loadData();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error deleting user',
          severity: 'error',
        });
      }
    }
  };

  const handlePromoteUser = async (userId: string) => {
    const adminSecret = prompt('Enter admin secret to promote user:');
    if (adminSecret) {
      try {
        await userAPI.promoteUser(userId, adminSecret);
        setSnackbar({
          open: true,
          message: 'User promoted to admin successfully',
          severity: 'success',
        });
        loadData();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error promoting user',
          severity: 'error',
        });
      }
    }
  };


  const handleClearOrderStatus = async (orderId: string) => {
    if (window.confirm('Are you sure you want to clear this order status and reset it to pending?')) {
      try {
        await orderAPI.clearOrderStatus(orderId);
        setSnackbar({
          open: true,
          message: 'Order status cleared successfully',
          severity: 'success',
        });
        loadData();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error clearing order status',
          severity: 'error',
        });
      }
    }
  };

  const handleClearUserOrders = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to clear all order statuses for user "${userName}"? This will reset all their orders to pending.`)) {
      try {
        await orderAPI.clearUserOrders(userId);
        setSnackbar({
          open: true,
          message: `All order statuses cleared for ${userName}`,
          severity: 'success',
        });
        loadData();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error clearing user orders',
          severity: 'error',
        });
      }
    }
  };

  const handleClearAllOrders = async () => {
    if (window.confirm('Are you sure you want to clear ALL order statuses in the system? This will reset all orders to pending. This action cannot be undone.')) {
      try {
        await orderAPI.clearAllOrders();
        setSnackbar({
          open: true,
          message: 'All order statuses cleared successfully',
          severity: 'success',
        });
        loadData();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Error clearing all orders',
          severity: 'error',
        });
      }
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <AdminIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.name}! Manage your store, users, and orders from here.
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
              <Tab 
                icon={<DashboardIcon />} 
                label="Overview" 
                iconPosition="start"
              />
              <Tab 
                icon={<StoreIcon />} 
                label="Products" 
                iconPosition="start"
              />
              <Tab 
                icon={<PeopleIcon />} 
                label="Users" 
                iconPosition="start"
              />
              <Tab 
                icon={<OrdersIcon />} 
                label="Orders" 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {products.length}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {users.length}
                  </Typography>
                  </CardContent>
              </Card>
              <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4">
                    {orders.length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Manage Products</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/products')}
                  sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                >
                  Browse Products to Edit
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/add-product')}
                >
                  Add New Product
                </Button>
              </Box>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Image</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <img 
                            src={product.images?.[0]?.url || ''} 
                            alt={product.name}
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <Chip 
                            label={product.stock} 
                            color={product.stock > 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => navigate(`/edit-product/${product._id}`)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteProduct(product._id)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Manage Users</Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Avatar</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <img 
                            src={user.avatar?.url || ''} 
                            alt={user.name}
                            style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={user.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {user.role !== 'admin' && (
                              <IconButton onClick={() => handlePromoteUser(user._id)} color="primary" title="Promote to admin">
                                <AdminIcon />
                              </IconButton>
                            )}
                            <IconButton 
                              onClick={() => handleClearUserOrders(user._id, user.name)} 
                              color="warning"
                              title="Clear all orders for this user"
                            >
                              <OrdersIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteUser(user._id)} color="error" title="Delete user">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>Manage Orders</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={handleClearAllOrders}
                  startIcon={<DeleteIcon />}
                >
                  Clear All Order Statuses
                </Button>
              </Box>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow key={order._id}>
                        <TableCell>{order._id}</TableCell>
                        <TableCell>{order.user?.name}</TableCell>
                        <TableCell>${order.totalAmount}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.orderStatus} 
                            color={
                              order.orderStatus === 'Delivered' ? 'success' :
                              order.orderStatus === 'Processing' ? 'warning' :
                              order.orderStatus === 'Shipped' ? 'info' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton onClick={() => navigate(`/order/${order._id}`)}>
                              <ViewIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleClearOrderStatus(order._id)} 
                              color="warning"
                              title="Clear order status"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
