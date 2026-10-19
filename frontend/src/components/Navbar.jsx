import React, { useEffect, useState } from 'react';
import { AppBar, Avatar, Box, Button, Container, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { Badge } from '@mui/material';
import { getUnreadNotificationCount } from '../api/notificationApi';

// The current page gets an underline that grows in from the left
const navLinkSx = (active) => ({
  position: 'relative',
  color: active ? 'text.primary' : 'text.secondary',
  px: { xs: 1, sm: 1.75 },
  minWidth: 0,
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 4,
    height: 2,
    borderRadius: 1,
    bgcolor: 'primary.main',
    transform: active ? 'scaleX(1)' : 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 260ms cubic-bezier(.2,.9,.3,1)',
  },
  '&:hover': { color: 'text.primary', backgroundColor: 'rgba(255,255,255,0.05)' },
  '&:hover::after': { transform: 'scaleX(1)' },
});

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return undefined;
    }

    let active = true;
    const loadUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationCount();
        if (active) setUnreadCount(Number(response.data) || 0);
      } catch (error) {
        if (active) setUnreadCount(0);
      }
    };

    loadUnreadCount();
    const intervalId = window.setInterval(loadUnreadCount, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user, pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const onAdmin = pathname.startsWith('/admin');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(24,24,24,0.82)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid',
        borderColor: scrolled ? 'rgba(255,255,255,0.1)' : 'transparent',
        boxShadow: scrolled ? '0 6px 24px rgba(0,0,0,0.35)' : 'none',
        transition: 'box-shadow 250ms ease, border-color 250ms ease',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          <Box
            component={Link}
            to="/"
            aria-label="BookMyShow home"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, '&:hover svg': { transform: 'rotate(-12deg) scale(1.08)' } }}
          >
            <MovieIcon sx={{ color: 'primary.main', fontSize: 32, transition: 'transform 250ms cubic-bezier(.2,1.3,.4,1)' }} />
            <Typography
              variant="h6"
              sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 800, color: 'primary.main', letterSpacing: '0.04em' }}
            >
              BookMyShow
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 } }}>
            <Button component={Link} to="/" sx={navLinkSx(pathname === '/')}>
              Home
            </Button>
            <Button component={Link} to="/movies" sx={navLinkSx(pathname.startsWith('/movies'))}>
              Movies
            </Button>

            {user && (
              <Button
                component={Link}
                to="/dashboard"
                startIcon={<AccountCircleOutlinedIcon />}
                sx={navLinkSx(pathname === '/dashboard')}
              >
                My Dashboard
              </Button>
            )}
            {user && (
              <Tooltip title="Notifications">
                <IconButton
                  component={Link}
                  to="/notifications"
                  aria-label="Notifications"
                  color="inherit"
                  sx={{ mx: 0.25 }}
                >
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsNoneIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <Button
              component={Link}
              to="/wishlist"
              startIcon={<FavoriteBorderIcon />}
              sx={navLinkSx(pathname === '/wishlist')}
            >
              Wishlist
            </Button>
            {user && isAdmin() && (
              <>
                <Button
                  component={Link}
                  to="/admin"
                  startIcon={<AdminPanelSettingsIcon />}
                  sx={{ ...navLinkSx(onAdmin), color: 'secondary.main', display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Admin
                </Button>
                <Tooltip title="Admin">
                  <IconButton
                    component={Link}
                    to="/admin"
                    aria-label="Admin"
                    color="secondary"
                    sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                  >
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0.5, sm: 1 } }}>
                <Tooltip title={user.name || user.email}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 15, fontWeight: 700 }}>{initial}</Avatar>
                </Tooltip>
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    maxWidth: 120,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name || user.email}
                </Typography>
                <Tooltip title="Sign out">
                  <IconButton color="inherit" onClick={handleLogout} aria-label="Sign out" size="small">
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, ml: { xs: 0.5, sm: 1 } }}>
                <Button component={Link} to="/login" variant="outlined" color="primary" size="small">
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
