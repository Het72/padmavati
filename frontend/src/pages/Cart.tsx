import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  IconButton,
  Divider,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { orderAPI, cartAPI } from '../services/api';

const Cart: React.FC = () => {
  const { state, dispatch } = useCart();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('info');

  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    phoneNo: '',
  });
  const [notes, setNotes] = useState('');

  // Mobile cart specific state - removed unnecessary state

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity: newQuantity } });
    }
  };

  const handleRemoveItem = (productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const handleClearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const handleProceedToCheckout = () => {
    setCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async () => {
    // Simplified validation for only required fields
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.phoneNo) {
      setToastSeverity('error');
      setToastMessage('Please provide name, address, and phone number.');
      setToastOpen(true);
      return;
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingInfo.phoneNo)) {
      setToastSeverity('error');
      setToastMessage('Please enter a valid 10-digit phone number.');
      setToastOpen(true);
      return;
    }

    // Validate product ids (must be MongoDB ObjectId strings)
    const hasInvalidIds = state.items.some(ci => typeof ci.product.id !== 'string' || String(ci.product.id).length < 12);
    if (hasInvalidIds) {
      setToastSeverity('error');
      setToastMessage('Some items are demo/local products. Please add products from the backend list and try again.');
      setToastOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      // 1) Persist cart to backend so server can read it during checkout
      const itemsPayload = state.items.map((ci) => ({
        product: String(ci.product.id),
        quantity: ci.quantity,
      }));
      try {
        await cartAPI.save(itemsPayload);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to save cart on server.';
        setToastSeverity('error');
        setToastMessage(msg);
        setToastOpen(true);
        setSubmitting(false);
        return;
      }

      // 2) Proceed with checkout
      const paymentInfo = { method: 'COD', status: 'Paid' } as any;
      const payload = { shippingInfo, paymentInfo, notes };
      const { data } = await orderAPI.create(payload);
      setToastSeverity('success');
      setToastMessage('Order placed. Invoice PDF sent via email.');
      setToastOpen(true);
      setCheckoutOpen(false);
      // Optionally clear cart locally after successful order
      dispatch({ type: 'CLEAR_CART' });
      console.log('Checkout response:', data);
    } catch (error: any) {
      setToastSeverity('error');
      setToastMessage(error?.response?.data?.message || 'Checkout failed.');
      setToastOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Mobile Cart Item Component
  const MobileCartItem = ({ item }: { item: any }) => {
    
    return (
      <Box sx={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        position: 'relative'
      }}>
        {/* Remove Button */}
        <IconButton
          onClick={() => handleRemoveItem(item.product.id)}
          sx={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#ff6b6b',
            padding: '4px'
          }}
        >
          ✕
        </IconButton>

        {/* Product Info */}
        <Box sx={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image={item.product.image}
              alt={item.product.name}
              sx={{
                width: '80px',
                height: '80px',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
            />
            {/* Checkmark */}
            <Box sx={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              backgroundColor: '#ff6b6b',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircleIcon sx={{ color: 'white', fontSize: '14px' }} />
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: '#888', fontSize: '12px', marginBottom: '2px' }}>
              {item.product.category}
            </Typography>
            <Typography sx={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              {item.product.name}
            </Typography>
            <Typography sx={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
              Sold by: {item.product.category.toUpperCase()} STORE
            </Typography>

            {/* Quantity Counter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  if (item.quantity > 1) {
                    handleUpdateQuantity(item.product.id, item.quantity - 1);
                  } else {
                    handleRemoveItem(item.product.id);
                  }
                }}
                sx={{
                  minWidth: '32px',
                  height: '32px',
                  padding: 0,
                  borderColor: '#4ade80',
                  color: '#4ade80',
                  '&:hover': {
                    backgroundColor: '#4ade80',
                    color: 'white'
                  }
                }}
              >
                -
              </Button>
              
              <Typography sx={{ color: 'white', fontSize: '14px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                {item.quantity}
              </Typography>
              
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                sx={{
                  minWidth: '32px',
                  height: '32px',
                  padding: 0,
                  borderColor: '#4ade80',
                  color: '#4ade80',
                  '&:hover': {
                    backgroundColor: '#4ade80',
                    color: 'white'
                  }
                }}
              >
                +
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Pricing */}
        <Box sx={{ marginBottom: '12px' }}>
          <Typography sx={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
            ₹{item.product.price}
          </Typography>
        </Box>

      </Box>
    );
  };

  if (state.items.length === 0) {
    return (
      <>
        {/* Desktop Empty Cart */}
        <Box sx={{ 
          background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)',
          display: { xs: 'none', md: 'block' }
        }}>
          <Container maxWidth="md" className="py-16">
            <Box className="text-center">
              <ShoppingCartIcon className="mb-4" sx={{ fontSize: 64, color: '#fff' }} />
              <Typography variant="h4" className="mb-4" sx={{ color: '#fff' }}>
                Your cart is empty
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }} className="mb-8">
                Looks like you haven't added any products to your cart yet.
              </Typography>
              <Link to="/products" className="text-decoration-none">
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<ArrowBackIcon />}
                >
                  Continue Shopping
                </Button>
              </Link>
            </Box>
          </Container>
        </Box>

        {/* Mobile Empty Cart */}
        <Box sx={{ 
          backgroundColor: '#0a0a0a',
          minHeight: '100vh',
          display: { xs: 'block', md: 'none' }
        }}>
          <Box sx={{ padding: '40px 20px', textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 48, color: '#888', marginBottom: '16px' }} />
            <Typography sx={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Your cart is empty
            </Typography>
            <Typography sx={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              Looks like you haven't added any products to your cart yet.
            </Typography>
            <Link to="/products" className="text-decoration-none">
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#4ade80',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#22c55e' }
                }}
              >
                Continue Shopping
              </Button>
            </Link>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <Box sx={{ 
        background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)',
        display: { xs: 'none', md: 'block' }
      }}>
        <Container maxWidth="lg" className="py-8">
          {/* Header */}
          <Box className="mb-8">
            <Typography variant="h3" className="font-bold mb-2" sx={{ color: '#fff' }}>
              Shopping Cart
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              {state.items.length} item{state.items.length !== 1 ? 's' : ''} in your cart
            </Typography>
          </Box>

          <Box className="flex flex-col lg:flex-row gap-6">
            {/* Cart Items */}
            <Box className="flex-1">
              <Card className="mb-6">
                <CardContent>
                  <Typography variant="h6" className="font-semibold mb-4">
                    Cart Items
                  </Typography>
                  {state.items.map((item) => (
                    <Box key={item.product.id}>
                      <Box className="flex flex-col sm:flex-row items-center gap-4 py-3">
                        <Box className="w-20 h-20 flex-shrink-0">
                          <CardMedia
                            component="img"
                            height="80"
                            image={item.product.image}
                            alt={item.product.name}
                            className="rounded object-cover"
                          />
                        </Box>
                        <Box className="flex-1 min-w-0">
                          <Typography variant="h6" className="font-semibold mb-1">
                            {item.product.name}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600">
                            {item.product.category}
                          </Typography>
                        </Box>
                        <Box className="text-center">
                          <Typography variant="h6" className="font-bold" sx={{ color: 'primary.main' }}>
                          ₹{item.product.price}
                          </Typography>
                        </Box>
                        <Box className="flex items-center gap-2">
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              handleUpdateQuantity(item.product.id, newQuantity);
                            }}
                            size="small"
                            className="w-16"
                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                        <Box className="text-center">
                          <Typography variant="h6" className="font-bold">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveItem(item.product.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Divider />
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Cart Actions */}
              <Box className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link to="/products" className="text-decoration-none">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<ArrowBackIcon />}
                  >
                    Continue Shopping
                  </Button>
                </Link>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </Button>
              </Box>
            </Box>

            {/* Order Summary */}
            <Box className="w-full lg:w-80">
              <Card className="sticky top-24">
                <CardContent>
                  <Typography variant="h6" className="font-semibold mb-4">
                    Order Summary
                  </Typography>
                  
                  <Box className="space-y-3 mb-6">
                    <Box className="flex justify-between">
                      <Typography variant="h6" className="font-bold">
                        Total:
                      </Typography>
                      <Typography variant="h6" className="font-bold" sx={{ color: 'primary.main' }}>
                      ₹{state.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    className="mb-3"
                    onClick={handleProceedToCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Mobile Layout */}
      <Box sx={{ 
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        display: { xs: 'block', md: 'none' }
      }}>
        <Box sx={{ padding: '16px' }}>
          {/* Cart Items */}
          {state.items.map((item) => (
            <MobileCartItem key={item.product.id} item={item} />
          ))}


          {/* Items Selected Section */}
          <Box sx={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <Typography sx={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              {state.items.length} Items selected for order
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {state.items.slice(0, 2).map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: '#2a2a2a'
                  }}
                >
                  <CardMedia
                    component="img"
                    image={item.product.image}
                    alt={item.product.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Place Order Button */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleProceedToCheckout}
            sx={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              height: '48px',
              borderRadius: '8px',
              textTransform: 'uppercase',
              marginBottom: '20px',
              '&:hover': { backgroundColor: '#ff5252' }
            }}
          >
            PLACE ORDER
          </Button>
        </Box>
      </Box>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onClose={() => !submitting && setCheckoutOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Checkout Information</DialogTitle>
      <DialogContent>
        <Box className="mt-2" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="Full Name" 
            fullWidth 
            required
            value={shippingInfo.name}
            onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })} 
          />
          <TextField 
            label="Phone Number" 
            fullWidth 
            required
            placeholder="10-digit mobile number"
            value={shippingInfo.phoneNo}
            onChange={(e) => setShippingInfo({ ...shippingInfo, phoneNo: e.target.value })} 
          />
          <TextField 
            label="Address" 
            fullWidth 
            required
            multiline
            minRows={3}
            placeholder="Complete delivery address"
            value={shippingInfo.address}
            onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })} 
          />
          <TextField 
            label="Order Notes (optional)" 
            fullWidth 
            multiline 
            minRows={2} 
            placeholder="Special instructions, delivery preferences, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)} 
          />
        </Box>
        <Alert severity="info" className="mt-3">
          A detailed PDF invoice will be sent to your email address. Please ensure all information is correct.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCheckoutOpen(false)} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={handleCheckoutSubmit} disabled={submitting}>Place Order</Button>
      </DialogActions>
    </Dialog>
      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>{toastMessage}</Alert>
      </Snackbar>
    </>
  );
};

export default Cart;
