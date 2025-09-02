import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
}

interface ProductData {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: Array<{ url: string }>;
}

const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });
  
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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

  // Fetch product data
  useEffect(() => {
    if (productId && isAdmin) {
      fetchProduct();
    }
  }, [productId, isAdmin]);

  const fetchProduct = async () => {
    try {
      setIsFetching(true);
      const response = await productAPI.getById(productId!);
      const product: ProductData = response.data.product;
      
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock > 0 ? product.stock.toString() : '1',
      });
      
      setIsOutOfStock(product.stock <= 0);
      
      if (product.images && product.images.length > 0) {
        setImagePreview(product.images[0].url);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to fetch product',
        severity: 'error',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name?: string; value: unknown } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please select an image file',
          severity: 'error',
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      
      // Set stock based on out-of-stock switch
      if (isOutOfStock) {
        formDataToSend.append('stock', '0');
      } else {
        const stockValue = parseInt(formData.stock) || 1;
        formDataToSend.append('stock', stockValue.toString());
      }

      // Only append image if a new one was selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // Update product via API
      await productAPI.update(productId!, formDataToSend);

      setSnackbar({
        open: true,
        message: 'Product updated successfully!',
        severity: 'success',
      });

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        navigate('/products');
      }, 1500);

    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating product',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!isAdmin) {
    return null;
  }

  if (isFetching) {
    return (
      <Box sx={{ 
        background: 'linear-gradient(135deg, var(--padma-cream) 0%, var(--padma-cream-strong) 100%)', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      background: 'linear-gradient(135deg, var(--padma-cream) 0%, var(--padma-cream-strong) 100%)', 
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin')} sx={{ color: 'primary.main' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Edit Product
          </Typography>
        </Box>

        {/* Product Form */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Product Name */}
                <TextField
                  fullWidth
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  variant="outlined"
                />

                {/* Price */}
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  variant="outlined"
                  inputProps={{ min: 0, step: 0.01 }}
                />

                {/* Description */}
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    multiline
                    rows={4}
                  />
                </Box>

                {/* Category */}
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange as any}
                  required
                  variant="outlined"
                  helperText="Type a new category name (e.g., Electronics, Grocery)"
                />

                {/* Stock Management */}
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isOutOfStock}
                          onChange={(e) => setIsOutOfStock(e.target.checked)}
                          color="error"
                        />
                      }
                      label="Mark as Out of Stock"
                    />
                  </Box>
                  
                  {!isOutOfStock && (
                    <TextField
                      fullWidth
                      label="Stock Quantity"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleInputChange}
                      variant="outlined"
                      inputProps={{ min: 0 }}
                      helperText="Enter stock quantity when product is available"
                    />
                  )}
                </Box>

                {/* Image Upload */}
                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Product Image
                  </Typography>
                  
                  {!imagePreview ? (
                    <Box
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => document.getElementById('image-input')?.click()}
                    >
                      <input
                        id="image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Click to upload new image or drag and drop
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        PNG, JPG, JPEG up to 5MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '200px',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                      <IconButton
                        onClick={removeImage}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'error.main',
                          color: 'white',
                          '&:hover': { backgroundColor: 'error.dark' },
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Submit Button */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  startIcon={<SaveIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:hover': { backgroundColor: 'var(--padma-navy-600)' },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Update Product'
                  )}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default EditProduct;
