import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Avatar,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  ShoppingBag as ShoppingBagIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [, setIsEditing] = useState(false);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" align="center">
          Please log in to view your profile
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
            My Profile
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            Manage your account and view your information
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4 }}>
          {/* Profile Information Card */}
          <Box sx={{ width: { xs: '100%', lg: '400px' } }}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              height: 'fit-content'
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                {/* Avatar */}
                <Box sx={{ mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      bgcolor: 'primary.main',
                      fontSize: '3rem',
                      mb: 2,
                    }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar.url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: '3rem' }} />
                    )}
                  </Avatar>
                  <Typography variant="h5" className="font-bold" sx={{ mb: 1 }}>
                    {user.name}
                  </Typography>
                  <Chip
                    label={user.role === 'admin' ? 'Administrator' : 'Customer'}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Quick Actions */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    fullWidth
                    onClick={() => setIsEditing(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Edit Profile
                  </Button>
                  
                  <Button
                    variant="contained"
                    startIcon={<ShoppingBagIcon />}
                    fullWidth
                    onClick={() => navigate('/orders')}
                    sx={{ 
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, var(--padma-navy) 30%, var(--padma-accent) 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, var(--padma-accent) 30%, var(--padma-navy) 90%)',
                      }
                    }}
                  >
                    View Orders
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Profile Details */}
          <Box sx={{ flex: 1 }}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" className="font-bold mb-4" sx={{ color: 'primary.main' }}>
                  Account Information
                </Typography>

                <List>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Full Name"
                      secondary={user.name}
                      primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }}
                      secondaryTypographyProps={{ fontSize: '1.1rem' }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Address"
                      secondary={user.email}
                      primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }}
                      secondaryTypographyProps={{ fontSize: '1.1rem' }}
                    />
                  </ListItem>

                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <SecurityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Account Type"
                      secondary={user.role === 'admin' ? 'Administrator Account' : 'Customer Account'}
                      primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }}
                      secondaryTypographyProps={{ fontSize: '1.1rem' }}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                {/* Additional Features */}
                <Typography variant="h6" className="font-bold mb-3" sx={{ color: 'primary.main' }}>
                  Quick Access
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        },
                      }}
                      onClick={() => navigate('/orders')}
                    >
                      <ShoppingBagIcon sx={{ fontSize: '3rem', color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" className="font-bold mb-2">
                        My Orders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View order history and track current orders
                      </Typography>
                    </Paper>
                  </Box>

                  {isAdmin && (
                    <Box sx={{ flex: 1 }}>
                      <Paper
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                          },
                        }}
                        onClick={() => navigate('/add-product')}
                      >
                        <LocationIcon sx={{ fontSize: '3rem', color: 'primary.main', mb: 2 }} />
                        <Typography variant="h6" className="font-bold mb-2">
                          Manage Products
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add, edit, or remove products from inventory
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Profile;
