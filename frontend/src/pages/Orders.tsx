import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  category: string;
  color: string;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  shippingInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
    phoneNo: string;
  };
  paymentInfo: {
    id: string;
    status: string;
  };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  invoiceNumber: string;
  createdAt: string;
  deliveredAt?: string;
  notes?: string;
}

const Orders: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching orders - User:', user, 'isAdmin:', isAdmin);
      
      if (user?._id) {
        try {
          // Use the correct API endpoint based on user role
          let response;
          if (isAdmin) {
            console.log('Admin user - fetching all orders');
            response = await orderAPI.getAll();
          } else {
            console.log('Regular user - fetching user-specific orders for ID:', user._id);
            response = await orderAPI.getUserOrders(user._id);
          }
          
          console.log('Orders API response:', response.data);
          setOrders(response.data.orders || []);
        } catch (apiError: any) {
          console.warn('API call failed, using mock data:', apiError.message);
          // Fallback to mock data if API fails
          setMockOrders();

          // Don't set error for API failures, just use mock data
        }
      } else {
        console.log('No user ID available, using mock data');
        setMockOrders();
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setMockOrders = () => {
    // Mock data for development/testing
    const mockOrders: Order[] = [
      {
        _id: '1',
        orderItems: [
          {
            product: 'product1',
            name: 'Premium Wireless Headphones',
            quantity: 2,
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
            category: 'Electronics',
            color: 'Black'
          }
        ],
        shippingInfo: {
          name: 'John Doe',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          pinCode: '10001',
          phoneNo: '+1-555-0123'
        },
        paymentInfo: {
          id: 'pay_123456',
          status: 'Paid'
        },
        itemsPrice: 399.98,
        totalPrice: 399.98,
        orderStatus: 'Delivered',
        invoiceNumber: 'INV-001',
        createdAt: '2024-01-15T10:00:00Z',
        deliveredAt: '2024-01-18T14:30:00Z',
        taxPrice: 0,
        shippingPrice: 0
      },
      {
        _id: '2',
        orderItems: [
          {
            product: 'product2',
            name: 'Smart Fitness Watch',
            quantity: 1,
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
            category: 'Wearables',
            color: 'Blue'
          }
        ],
        shippingInfo: {
          name: 'Jane Smith',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          pinCode: '90210',
          phoneNo: '+1-555-0456'
        },
        paymentInfo: {
          id: 'pay_789012',
          status: 'Paid'
        },
        itemsPrice: 299.99,
        totalPrice: 299.99,
        orderStatus: 'Shipped',
        invoiceNumber: 'INV-002',
        createdAt: '2024-01-20T09:00:00Z',
        taxPrice: 0,
        shippingPrice: 0
      }
    ];
    
    setOrders(mockOrders);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Processing':
        return 'info';
      case 'Shipped':
        return 'primary';
      case 'Delivered':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <ScheduleIcon />;
      case 'Processing':
        return <FilterIcon />;
      case 'Shipped':
        return <ShippingIcon />;
      case 'Delivered':
        return <CheckCircleIcon />;
      case 'Cancelled':
        return <CancelIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const matchesSearch = order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderItems.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleDownloadPDF = async (orderId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Create a temporary link to download the PDF
      const response = await fetch(` https://padmavati-backend.onrender.com/api/orders/${orderId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Find the order to get customer name
      const order = orders.find(o => o._id === orderId);
      const customerName = order?.shippingInfo?.name || 'customer';
      const sanitizedName = customerName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
      link.download = `invoice_${sanitizedName}_${orderId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF download error:', error);
      setError('Failed to download PDF');
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" align="center">
          Please log in to view your orders
        </Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, var(--padma-navy) 0%, var(--padma-accent) 100%)',
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box className="text-center mb-8">
          <Typography variant="h3" className="font-bold mb-4" sx={{ color: '#fff' }}>
            My Orders
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            Track your orders and view order history
          </Typography>
        </Box>

        {/* Filters and Search */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" />,
                  }}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: '200px' } }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Processing">Processing</MenuItem>
                    <MenuItem value="Shipped">Shipped</MenuItem>
                    <MenuItem value="Delivered">Delivered</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate('/profile')}
                >
                  Back to Profile
                </Button>
                {isAdmin && (
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={() => navigate('/admin/orders')}
                  >
                    Admin Orders
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Box className="text-center py-16">
            <CircularProgress size={60} sx={{ color: '#fff' }} />
            <Typography variant="h6" sx={{ color: '#fff', mt: 2 }}>
              Loading orders...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box className="text-center py-16">
            <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Orders Table */}
        {!isLoading && !error && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Order #</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Items</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order._id} hover>
                        <TableCell>
                          <Typography variant="body2" className="font-bold">
                            {order.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" className="font-bold">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {order.orderItems.length} item(s)
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-bold" sx={{ color: 'primary.main' }}>
                            ₹{order.totalPrice.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(order.orderStatus)}
                            label={order.orderStatus}
                            color={getStatusColor(order.orderStatus) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Order Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewOrder(order)}
                                sx={{ color: 'primary.main' }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download PDF">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadPDF(order._id)}
                                sx={{ color: 'success.main' }}
                              >
                                <ReceiptIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Empty State */}
              {filteredOrders.length === 0 && (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                  <ShoppingBagIcon sx={{ fontSize: '4rem', color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No orders found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Start shopping to see your orders here'
                    }
                  </Typography>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button
                      variant="contained"
                      onClick={() => navigate('/products')}
                      sx={{ mt: 2 }}
                    >
                      Browse Products
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Details Dialog */}
        <Dialog
          open={isOrderDialogOpen}
          onClose={handleCloseOrderDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedOrder && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon color="primary" />
                  <Typography variant="h6">
                    Order Details - {selectedOrder.invoiceNumber}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Order Items */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Order Items
                    </Typography>
                    <List>
                      {selectedOrder.orderItems.map((item, index) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              {/* Product Image */}
                              <Box sx={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 2, 
                                overflow: 'hidden',
                                border: '1px solid #e0e0e0'
                              }}>
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover' 
                                  }}
                                />
                              </Box>
                              
                              {/* Product Details */}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" className="font-bold" sx={{ mb: 0.5 }}>
                                  {item.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
                                  <Chip 
                                    label={`Category: ${item.category || 'N/A'}`} 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                  />
                                  <Chip 
                                    label={`Color: ${item.color || 'N/A'}`} 
                                    size="small" 
                                    variant="outlined"
                                    color="secondary"
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  Quantity: {item.quantity} | Price: ₹{item.price.toFixed(2)}
                                </Typography>
                              </Box>
                              
                              {/* Total Price */}
                              <Typography variant="body1" className="font-bold" sx={{ color: 'primary.main' }}>
                                ₹{(item.quantity * item.price).toFixed(2)}
                              </Typography>
                            </Box>
                          </ListItem>
                          {index < selectedOrder.orderItems.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>

                  {/* Order Summary and Order Timestamp Row */}
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    {/* Order Summary */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        Order Summary
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Items Price:</Typography>
                          <Typography variant="body2">₹{selectedOrder.itemsPrice.toFixed(2)}</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" className="font-bold">Total:</Typography>
                          <Typography variant="h6" className="font-bold" sx={{ color: 'primary.main' }}>
                            ₹{selectedOrder.totalPrice.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Order Timestamp */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        Order Timestamp
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Order Time:</strong> {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                        </Typography>
                        {selectedOrder.deliveredAt && (
                          <>
                            <Typography variant="body2">
                              <strong>Delivered Date:</strong> {new Date(selectedOrder.deliveredAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Delivered Time:</strong> {new Date(selectedOrder.deliveredAt).toLocaleTimeString()}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Shipping Information */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Shipping Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Address:</strong> {selectedOrder.shippingInfo.address}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedOrder.shippingInfo.phoneNo}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Order Status */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        Order Status
                      </Typography>
                      <Chip
                        icon={getStatusIcon(selectedOrder.orderStatus)}
                        label={selectedOrder.orderStatus}
                        color={getStatusColor(selectedOrder.orderStatus) as any}
                        size="medium"
                      />
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button 
                  variant="outlined" 
                  startIcon={<ReceiptIcon />}
                  onClick={() => handleDownloadPDF(selectedOrder._id)}
                  sx={{ mr: 1 }}
                >
                  Download PDF
                </Button>
                <Button onClick={handleCloseOrderDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </Box>
  );
};

export default Orders;
