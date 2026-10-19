import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import TheatersIcon from '@mui/icons-material/Theaters';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AnimatedNumber from '../../components/AnimatedNumber';
import { getMovies } from '../../api/movieApi';
import { getTheatres } from '../../api/theatreApi';
import { getShows } from '../../api/showApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    movies: 0,
    theatres: 0,
    shows: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [moviesRes, theatresRes, showsRes] = await Promise.allSettled([
          getMovies({ page: 0, size: 1 }),
          getTheatres({ page: 0, size: 1 }),
          getShows({ page: 0, size: 1 }),
        ]);

        const moviesCount =
          moviesRes.status === 'fulfilled'
            ? moviesRes.value.data?.totalElements ??
              (Array.isArray(moviesRes.value.data?.content)
                ? moviesRes.value.data.content.length
                : 0)
            : 0;

        const theatresCount =
          theatresRes.status === 'fulfilled'
            ? theatresRes.value.data?.totalElements ??
              (Array.isArray(theatresRes.value.data)
                ? theatresRes.value.data.length
                : theatresRes.value.data?.content?.length || 0)
            : 0;

        const showsCount =
          showsRes.status === 'fulfilled'
            ? showsRes.value.data?.totalElements ??
              (Array.isArray(showsRes.value.data)
                ? showsRes.value.data.length
                : showsRes.value.data?.content?.length || 0)
            : 0;

        setStats({
          movies: moviesCount,
          theatres: theatresCount,
          shows: showsCount,
        });
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Movies',
      count: stats.movies,
      icon: <MovieIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/admin/movies',
      color: '#E53935',
    },
    {
      title: 'Total Theatres',
      count: stats.theatres,
      icon: <TheatersIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      path: '/admin/theatres',
      color: '#FF6D00',
    },
    {
      title: 'Active Shows',
      count: stats.shows,
      icon: <ConfirmationNumberIcon sx={{ fontSize: 40, color: '#4CAF50' }} />,
      path: '/admin/shows',
      color: '#4CAF50',
    },
  ];

  const quickActions = [
    { title: 'Manage Movies', desc: 'Add, update or publish movies', path: '/admin/movies', icon: <MovieIcon /> },
    { title: 'Manage Theatres', desc: 'Configure theatres and screens', path: '/admin/theatres', icon: <TheatersIcon /> },
    { title: 'Manage Shows', desc: 'Schedule shows and seat inventory', path: '/admin/shows', icon: <ConfirmationNumberIcon /> },
    { title: 'Manage Genres', desc: 'Create and organize movie categories', path: '/admin/genres', icon: <CategoryIcon /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Welcome Banner */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, <strong style={{ color: '#fff' }}>{user?.name || user?.email || 'Admin'}</strong>. Monitor and manage your platform operations.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={4} key={card.title}>
            <Card
              sx={{
                backgroundColor: '#1E1E1E',
                borderRadius: 3,
                boxShadow: 3,
                borderLeft: `5px solid ${card.color}`,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardActionArea onClick={() => navigate(card.path)} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, my: 1 }}>
                      {loading ? <CircularProgress size={32} /> : <AnimatedNumber value={card.count} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      View all <ArrowForwardIcon sx={{ fontSize: 12 }} />
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Section */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Quick Management
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.title}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: '#1E1E1E',
                borderRadius: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(action.path)}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {action.icon}
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.5 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.desc}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
