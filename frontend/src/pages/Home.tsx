import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const Home: React.FC = () => {

  return (
    <div>
      {/* Hero Section */}
      <Box className="text-white py-20" sx={{ background: 'linear-gradient(90deg, var(--padma-navy) 0%, var(--padma-accent) 100%)' }}>
        <Container maxWidth="lg">
          <Box className="flex flex-col md:flex-row items-center gap-8">
            <Box className="flex-1">
              <Typography variant="h2" className="font-bold mb-4">
                Welcome to 
                <span className="text-padma-cream"> Padmavati Creations</span>
              </Typography>
              <Typography variant="h5" className="mb-6 opacity-90">
                Discover best products with variety of range here
              </Typography>
              <Link to="/products" className="text-decoration-none">
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: 'var(--padma-cream)',
                    color: 'var(--padma-navy)',
                    '&:hover': { backgroundColor: 'var(--padma-cream-strong)' },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Shop Now
                </Button>
              </Link>
            </Box>
            <Box className="flex-1 text-center">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=400&fit=crop"
                alt="Shopping"
                className="rounded-lg shadow-2xl"
              />
            </Box>
          </Box>
        </Container>
      </Box>

    </div>
  );
};

export default Home;
