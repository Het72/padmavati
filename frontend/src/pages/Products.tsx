import React, { useState, useEffect } from 'react';
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

const Products: React.FC = () => {
  const { state, dispatch } = useCart();
  const { isAdmin, user } = useAuth();
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
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await productAPI.getAll();
        clearTimeout(timeoutId);
        
        if (response.data && response.data.products) {
          const backendProducts = response.data.products.map((product: any) => ({
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image',
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
        
        // Fallback to hardcoded products if backend fails
        setProducts([
          {
            id: 1,
            name: 'Premium Wireless Headphones',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
            description: 'High-quality wireless headphones with noise cancellation technology',
            category: 'Electronics',
            stock: 10,
          },
          {
            id: 2,
            name: 'Smart Fitness Watch',
            price: 299.99,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
            description: 'Track your fitness goals with this advanced smartwatch',
            category: 'Electronics',
            stock: 5,
          },
        ]);
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
          image: product.images?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Image',
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

  // Helper function to get cart quantity for a product
  const getCartQuantity = (productId: number) => {
    const cartItem = state.items.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleDeleteProduct = async (productId: string) => {
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
  };

  const handleDeleteCategory = async () => {
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
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    
    // Show only the general success snackbar
    setShowSuccess(true);
  };

  // Add a small delay to make the cart counter update more visible
  const handleAddToCartWithDelay = (product: Product) => {
    // Add a small delay to show the button state change
    setTimeout(() => {
      handleAddToCart(product);
    }, 100);
  };

  const handleCloseSnackbar = () => {
    setShowSuccess(false);
  };

  
  return (
    <Box sx={{ background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)' }}>
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
        {isAdmin === true ? (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-product')}
            sx={{ mt: 2 }}
          >
            Add New Product
          </Button>
        ) : (
          // Debug button to help identify issues with admin role detection
          <>
            {console.log('Products page - isAdmin state:', isAdmin)}
            {user && user.role === 'admin' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<AddIcon />}
                onClick={() => {
                  console.log('Debug - User role:', user.role, 'isAdmin state:', isAdmin);
                  navigate('/add-product');
                }}
                sx={{ mt: 2, border: '2px dashed red' }}
              >
                Debug: Admin Button (Role is admin but isAdmin is false)
              </Button>
            )}
          </>
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
            <Card key={product.id} className="h-full hover:shadow-lg transition-shadow duration-300 relative">
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
              {getCartQuantity(product.id) > 0 && (
                <Box
                  className="absolute top-3 right-3 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-xl"
                  sx={{ 
                    minWidth: '40px', 
                    minHeight: '40px',
                    border: '2px solid white'
                  }}
                >
                  <Typography variant="caption" className="font-bold text-sm">
                    {getCartQuantity(product.id)}
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
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                }}
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
                   {getCartQuantity(product.id) > 0 ? (
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
                               if (getCartQuantity(product.id) > 1) {
                                 dispatch({ type: 'UPDATE_QUANTITY', payload: { id: product.id, quantity: getCartQuantity(product.id) - 1 } });
                               } else {
                                 dispatch({ type: 'REMOVE_ITEM', payload: product.id });
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
                             {getCartQuantity(product.id)}
                           </Typography>
                           
                                                        <Button
                               size="small"
                               variant="outlined"
                               onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { id: product.id, quantity: getCartQuantity(product.id) + 1 } })}
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
                           onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: product.id })}
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
                        onClick={() => handleAddToCartWithDelay(product)}
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
                         onClick={() => handleDeleteProduct(product.id as any)}
                         fullWidth
                       >
                         Delete
                       </Button>
                     </>
                   )}
                 </Box>
              </CardContent>
            </Card>
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

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
                 anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Product added to cart successfully!
        </Alert>
      </Snackbar>

      
      </Container>
    </Box>
  );
};

export default Products;

