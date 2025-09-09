import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useCart, type Product } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';

// Desktop Product Card Component
const DesktopProductCard = memo(({ 
  product, 
  cartQuantity, 
  isAdmin, 
  onAddToCart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onDeleteProduct 
}: {
  product: Product;
  cartQuantity: number;
  isAdmin: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onDeleteProduct: (id: string) => void;
}) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300 relative">
      {/* Out of Stock Overlay - Only show for non-admin users */}
      {product.stock <= 0 && !isAdmin && (
        <Box
          className="absolute inset-0 z-20 flex items-center justify-center"
          sx={{ 
            borderRadius: 'inherit',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(1px)'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              transform: 'rotate(-15deg)',
              fontSize: '1.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '8px 16px',
              borderRadius: '4px'
            }}
          >
            OUT OF STOCK
          </Typography>
        </Box>
      )}
      
      {/* Cart Counter Badge */}
      {cartQuantity > 0 && (
        <Box
          className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl"
          sx={{ 
            minWidth: '40px', 
            minHeight: '40px',
            border: '2px solid white'
          }}
        >
          <Typography variant="caption" className="font-bold text-sm">
            {cartQuantity}
          </Typography>
        </Box>
      )}
      
      <CardMedia
        component="img"
        height="200"
        image={product.image}
        alt={product.name}
        className="object-cover"
        loading="lazy"
        style={{
          transition: 'opacity 0.3s ease',
          opacity: 1
        }}
      />
      <CardContent className="flex-grow">
        <Box className="mb-2">
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={product.category}
              size="small"
              sx={{ backgroundColor: 'var(--padma-cream-strong)', color: 'var(--padma-navy)', fontWeight: 600 }}
            />
          </Box>
        </Box>
        <Typography variant="h6" className="font-semibold mb-2 line-clamp-2">
          {product.name}
        </Typography>
        <Typography variant="body2" className="text-gray-600 mb-3 line-clamp-3">
          {product.description}
        </Typography>
        <Typography variant="h5" className="font-bold mb-3" sx={{ color: 'primary.main' }}>
          ₹ {product.price}
        </Typography>
        
        {/* Cart Quantity Controls */}
        <Box className="mb-3">
          {cartQuantity > 0 ? (
            // Show quantity controls when item is in cart
            <Box className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Box className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-blue-700 font-medium">
                  🛒 In Cart
                </Typography>
              </Box>
              
              {/* Quantity Controls */}
              <Box className="flex items-center justify-between">
                <Box className="flex items-center gap-2">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (cartQuantity > 1) {
                        onUpdateQuantity(product.id, cartQuantity - 1);
                      } else {
                        onRemoveItem(product.id);
                      }
                    }}
                    sx={{ 
                      minWidth: '32px', 
                      height: '32px', 
                      padding: 0,
                      borderColor: 'var(--padma-navy)',
                      color: 'var(--padma-navy)',
                      '&:hover': { 
                        backgroundColor: 'var(--padma-navy)',
                        color: 'white'
                      }
                    }}
                  >
                    -
                  </Button>
                  
                  <Typography variant="h6" className="font-bold text-blue-700 min-w-[40px] text-center">
                    {cartQuantity}
                  </Typography>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                    sx={{ 
                      minWidth: '32px', 
                      height: '32px', 
                      padding: 0,
                      borderColor: 'var(--padma-navy)',
                      color: 'var(--padma-navy)',
                      '&:hover': { 
                        backgroundColor: 'var(--padma-navy)',
                        color: 'white'
                      }
                    }}
                  >
                    +
                  </Button>
                </Box>
                
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => onRemoveItem(product.id)}
                  sx={{ 
                    minWidth: 'auto', 
                    padding: '4px 12px',
                    fontSize: '0.75rem'
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Box>
          ) : (
            // Show add to cart button when item is not in cart
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<ShoppingCartIcon />}
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
              sx={{ 
                '&:hover': { 
                  backgroundColor: product.stock <= 0 ? 'primary.main' : 'var(--padma-navy-600)' 
                },
                backgroundColor: product.stock <= 0 ? 'grey.400' : 'primary.main',
                transition: 'all 0.3s ease',
                height: '48px',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </Box>
        
        <Box className="grid grid-cols-1 gap-2">
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/edit-product/${product.id}`)}
                fullWidth
              >
                Edit Product
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => onDeleteProduct(product.id as any)}
                fullWidth
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

// Mobile Product Card Component - Simplified Mobile Style
const MobileProductCard = memo(({ 
  product, 
  cartQuantity, 
  isAdmin, 
  onAddToCart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onDeleteProduct 
}: {
  product: Product;
  cartQuantity: number;
  isAdmin: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onDeleteProduct: (id: string) => void;
}) => {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.2s ease',
        '&:hover': { transform: 'translateY(-2px)' }
      }}
    >
      {/* Product Image Container */}
      <Box sx={{ position: 'relative', aspectRatio: '3/4' }}>
        <CardMedia
          component="img"
          image={product.image}
          alt={product.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#2a2a2a'
          }}
          loading="lazy"
        />

        {/* Cart Counter Badge */}
        {cartQuantity > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#ff6b6b',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}
          >
            <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
              {cartQuantity}
            </Typography>
          </Box>
        )}

        {/* Out of Stock Overlay */}
        {product.stock <= 0 && !isAdmin && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)'
            }}
          >
            <Typography
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                padding: '8px 16px',
                borderRadius: '8px',
                transform: 'rotate(-5deg)'
              }}
            >
              OUT OF STOCK
            </Typography>
          </Box>
        )}
      </Box>

      {/* Product Details */}
      <Box sx={{ padding: '12px', backgroundColor: '#1a1a1a' }}>
        {/* Brand */}
        <Typography
          sx={{
            color: '#888',
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {product.category}
        </Typography>

        {/* Product Name */}
        <Typography
          sx={{
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            lineHeight: '1.3',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {product.name}
        </Typography>

        {/* Simple Pricing */}
        <Box sx={{ marginBottom: '8px' }}>
          <Typography
            sx={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ₹{product.price}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: '8px' }}>
          {cartQuantity > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  if (cartQuantity > 1) {
                    onUpdateQuantity(product.id, cartQuantity - 1);
                  } else {
                    onRemoveItem(product.id);
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
                {cartQuantity}
              </Typography>
              
              <Button
                size="small"
                variant="outlined"
                onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
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
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
              sx={{
                backgroundColor: product.stock <= 0 ? '#444' : '#4ade80',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                height: '36px',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: product.stock <= 0 ? '#444' : '#22c55e'
                }
              }}
            >
              {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </Box>

        {/* Admin Controls */}
        {isAdmin && (
          <Box sx={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate(`/edit-product/${product.id}`)}
              sx={{
                flex: 1,
                fontSize: '10px',
                height: '28px',
                borderColor: '#4ade80',
                color: '#4ade80',
                '&:hover': {
                  backgroundColor: '#4ade80',
                  color: 'white'
                }
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onDeleteProduct(product.id as any)}
              sx={{
                flex: 1,
                fontSize: '10px',
                height: '28px',
                borderColor: '#ff6b6b',
                color: '#ff6b6b',
                '&:hover': {
                  backgroundColor: '#ff6b6b',
                  color: 'white'
                }
              }}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
});

const Products: React.FC = () => {
  const { state, dispatch } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // Fetch products from backend with optimized loading
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Reduced timeout for faster fallback
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await productAPI.getAll();
        clearTimeout(timeoutId);
        
        if (response.data && response.data.products) {
          const backendProducts = response.data.products.map((product: any) => ({
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || '',
            description: product.description,
            category: product.category,
            stock: product.stock !== undefined && product.stock !== null ? product.stock : 1,
          }));
          setProducts(backendProducts);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError(error.message || 'Failed to fetch products');
        
        // Fallback to empty array for faster loading
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const refreshProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getAll();
              const backendProducts = response.data.products.map((product: any) => ({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0]?.url || '',
          description: product.description,
          category: product.category,
          stock: product.stock !== undefined && product.stock !== null ? product.stock : 1,
        }));
      setProducts(backendProducts);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh products');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized computed values
  const categories = useMemo(() => 
    ['all', ...Array.from(new Set(products.map(p => p.category)))], 
    [products]
  );

  const filteredProducts = useMemo(() => 
    products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }), 
    [products, searchTerm, categoryFilter]
  );

  // Memoized callback functions
  const getCartQuantity = useCallback((productId: number) => {
    const cartItem = state.items.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  }, [state.items]);

  const handleAddToCart = useCallback((product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    setShowSuccess(true);
  }, [dispatch]);

  const handleUpdateQuantity = useCallback((id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, [dispatch]);

  const handleRemoveItem = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, [dispatch]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!isAdmin) return;
    const confirm = window.confirm('Are you sure you want to delete this product?');
    if (!confirm) return;
    try {
      await productAPI.deleteProduct(productId);
      setShowSuccess(true);
      await refreshProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  }, [isAdmin]);

  const handleDeleteCategory = useCallback(async () => {
    if (!isAdmin) return;
    if (categoryFilter === 'all') return;
    const confirm = window.confirm(`Delete category "${categoryFilter}" and all products under it?`);
    if (!confirm) return;
    try {
      await productAPI.deleteCategory(categoryFilter);
      setShowSuccess(true);
      setCategoryFilter('all');
      await refreshProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  }, [isAdmin, categoryFilter]);

  const handleCloseSnackbar = useCallback(() => {
    setShowSuccess(false);
  }, []);

  
  return (
    <>
      {/* Desktop Layout */}
      <Box sx={{ 
        background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)',
        display: { xs: 'none', md: 'block' }
      }}>
        <Container maxWidth="lg" className="py-8">
          {/* Header */}
          <Box className="text-center mb-8">
            <Typography variant="h3" className="font-bold mb-4" sx={{ color: '#fff' }}>
              Our Products
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Discover amazing products at unbeatable prices
            </Typography>
            
            {/* Add Product Button - Only visible to admin users */}
            {isAdmin && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/add-product')}
                sx={{ mt: 2 }}
              >
                Add New Product
              </Button>
            )}
          </Box>

          {/* Cart Summary */}
          {state.items.length > 0 && (
            <Box className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200">
              <Box className="flex items-center justify-between">
                <Box className="flex items-center gap-3">
                  <Box className="bg-blue-500 p-2 rounded-full">
                    <ShoppingCartIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" className="font-semibold text-blue-800">
                      Shopping Cart
                    </Typography>
                    <Typography variant="body2" className="text-blue-600">
                      {state.items.length} item{state.items.length !== 1 ? 's' : ''} • Total: ₹{state.total.toFixed(2)}
                    </Typography>
                    {/* Quick cart preview */}
                    <Box className="mt-2 flex flex-wrap gap-1">
                      {state.items.slice(0, 3).map((item) => (
                        <Chip
                          key={item.product.id}
                          label={`${item.product.name} (${item.quantity})`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            borderColor: 'var(--padma-navy)',
                            color: 'var(--padma-navy)'
                          }}
                        />
                      ))}
                      {state.items.length > 3 && (
                        <Chip
                          label={`+${state.items.length - 3} more`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem',
                            borderColor: 'var(--padma-navy)',
                            color: 'var(--padma-navy)'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/cart')}
                  startIcon={<ShoppingCartIcon />}
                  sx={{
                    backgroundColor: 'var(--padma-navy)',
                    '&:hover': { backgroundColor: 'var(--padma-navy-600)' }
                  }}
                >
                  View Cart
                </Button>
              </Box>
            </Box>
          )}

          {/* Filters */}
          <Box className="mb-8">
            <Box className="flex flex-col md:flex-row gap-4 items-center">
              <Box className="flex-1">
                <TextField
                  fullWidth
                  label="Search products..."
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border rounded-xl"
                />
              </Box>
              <Box className="w-full md:w-48 flex items-center gap-2">
                <FormControl fullWidth>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {isAdmin && categoryFilter !== 'all' && (
                  <Button variant="outlined" color="error" onClick={handleDeleteCategory}>
                    Delete Category
                  </Button>
                )}
              </Box>
              <Box className="text-center md:text-left">
                <Typography variant="body2" className="text-white">
                  {filteredProducts.length} products found
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Loading State */}
          {isLoading && (
            <Box className="text-center py-16">
              <CircularProgress size={60} sx={{ color: '#fff' }} />
              <Typography variant="h6" sx={{ color: '#fff', mt: 2 }}>
                Loading products...
              </Typography>
            </Box>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="h-full">
                  <Box sx={{ height: 200, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress size={40} sx={{ color: '#fff' }} />
                  </Box>
                  <CardContent>
                    <Box sx={{ height: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, mb: 2 }} />
                    <Box sx={{ height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, mb: 1, width: '60%' }} />
                    <Box sx={{ height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, mb: 2, width: '40%' }} />
                    <Box sx={{ height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
                  </CardContent>
                </Card>
              ))}
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

          {/* Products Grid */}
          {!isLoading && !error && (
            <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <DesktopProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getCartQuantity(product.id)}
                  isAdmin={isAdmin}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onDeleteProduct={handleDeleteProduct}
                />
              ))}
            </Box>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredProducts.length === 0 && (
            <Box className="text-center py-16">
              <Typography variant="h6" className="text-gray-500 mb-4">
                No products found
              </Typography>
              <Typography variant="body2" className="text-gray-400">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Mobile Layout */}
      <Box sx={{ 
        backgroundColor: '#0a0a0a', 
        minHeight: '100vh',
        display: { xs: 'block', md: 'none' }
      }}>

        {/* Mobile Filters */}
        <Box sx={{ 
          backgroundColor: '#1a1a1a', 
          padding: '12px 16px',
          borderBottom: '1px solid #333'
        }}>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#4ade80' }
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                  fontSize: '14px'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#888',
                  opacity: 1
                }
              }}
            />
            <FormControl sx={{ minWidth: '120px' }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#666' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4ade80' }
                }}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category} sx={{ color: 'white' }}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#888', fontSize: '12px' }}>
              {filteredProducts.length} products found
            </Typography>
            <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isAdmin && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/add-product')}
                  sx={{
                    backgroundColor: '#4ade80',
                    color: 'white',
                    fontSize: '10px',
                    height: '24px',
                    borderRadius: '6px',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#22c55e' }
                  }}
                >
                  Add Product
                </Button>
              )}
              {isAdmin && categoryFilter !== 'all' && (
                <Button 
                  variant="outlined" 
                  onClick={handleDeleteCategory}
                  sx={{
                    fontSize: '10px',
                    height: '24px',
                    borderColor: '#ff6b6b',
                    color: '#ff6b6b',
                    '&:hover': {
                      backgroundColor: '#ff6b6b',
                      color: 'white'
                    }
                  }}
                >
                  Delete Category
                </Button>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Mobile Loading State */}
        {isLoading && (
          <Box sx={{ padding: '20px', textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ color: '#4ade80' }} />
            <Typography sx={{ color: '#888', mt: 2, fontSize: '14px' }}>
              Loading products...
            </Typography>
          </Box>
        )}

        {/* Mobile Loading Skeleton */}
        {isLoading && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px', 
            padding: '16px' 
          }}>
            {[...Array(6)].map((_, index) => (
              <Box key={index} sx={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: '12px', 
                overflow: 'hidden' 
              }}>
                <Box sx={{ 
                  aspectRatio: '3/4', 
                  backgroundColor: '#2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CircularProgress size={24} sx={{ color: '#4ade80' }} />
                </Box>
                <Box sx={{ padding: '12px' }}>
                  <Box sx={{ height: '12px', backgroundColor: '#2a2a2a', borderRadius: '4px', mb: '8px' }} />
                  <Box sx={{ height: '16px', backgroundColor: '#2a2a2a', borderRadius: '4px', mb: '8px', width: '80%' }} />
                  <Box sx={{ height: '14px', backgroundColor: '#2a2a2a', borderRadius: '4px', mb: '8px', width: '60%' }} />
                  <Box sx={{ height: '32px', backgroundColor: '#2a2a2a', borderRadius: '8px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Mobile Error State */}
        {error && !isLoading && (
          <Box sx={{ padding: '20px', textAlign: 'center' }}>
            <Alert 
              severity="error" 
              sx={{ 
                backgroundColor: '#2a1a1a', 
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                '& .MuiAlert-icon': { color: '#ff6b6b' }
              }}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Mobile Products Grid - 2-column layout */}
        {!isLoading && !error && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px', 
            padding: '16px' 
          }}>
            {filteredProducts.map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                cartQuantity={getCartQuantity(product.id)}
                isAdmin={isAdmin}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onDeleteProduct={handleDeleteProduct}
              />
            ))}
          </Box>
        )}

        {/* Mobile Empty State */}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <Box sx={{ padding: '40px 20px', textAlign: 'center' }}>
            <Typography sx={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
              No products found
            </Typography>
            <Typography sx={{ color: '#666', fontSize: '14px' }}>
              Try adjusting your search or filter criteria
            </Typography>
          </Box>
        )}

      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          sx={{ 
            width: '100%',
            backgroundColor: '#1a2a1a',
            color: '#4ade80',
            border: '1px solid #4ade80',
            '& .MuiAlert-icon': { color: '#4ade80' }
          }}
        >
          Product added to cart successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default Products;
