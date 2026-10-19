import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { darkTheme } from './theme/darkTheme';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PageTransition from './components/PageTransition';

// Public pages
import Home from './pages/public/Home';
import MoviesPage from './pages/public/MoviesPage';
import MovieDetail from './pages/public/MovieDetail';
import ShowsPage from './pages/public/ShowsPage';
import SeatSelection from './pages/public/SeatSelection';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Dashboard from './pages/public/Dashboard';
import TicketDetails from './pages/public/TicketDetails';
import WishlistPage from './pages/public/WishlistPage';
import NotificationsPage from './pages/public/NotificationsPage';
import VerifyEmail from './pages/public/verifyEmail';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import MovieForm from './pages/admin/MovieForm';
import AdminGenres from './pages/admin/AdminGenres';
import AdminTheatres from './pages/admin/AdminTheatres';
import AdminScreens from './pages/admin/AdminScreens';
import AdminSeatLayout from './pages/admin/AdminSeatLayout';
import AdminShows from './pages/admin/AdminShows';
import AdminShowSeats from './pages/admin/AdminShowSeats';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <BrowserRouter>
            <Navbar />
            <PageTransition>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* Protected user routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/movies/:id" element={<MovieDetail />} />
                <Route path="/movies/:movieId/shows" element={<ShowsPage />} />
                <Route path="/shows/:showId/seats" element={<SeatSelection />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tickets/:bookingId" element={<TicketDetails />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/movies" element={<AdminMovies />} />
                <Route path="/admin/movies/new" element={<MovieForm />} />
                <Route path="/admin/movies/:id/edit" element={<MovieForm />} />
                <Route path="/admin/genres" element={<AdminGenres />} />
                <Route path="/admin/theatres" element={<AdminTheatres />} />
                <Route path="/admin/theatres/:theatreId/screens" element={<AdminScreens />} />
                <Route path="/admin/theatres/:theatreId/screens/:screenId/seats" element={<AdminSeatLayout />} />
                <Route path="/admin/shows" element={<AdminShows />} />
                <Route path="/admin/shows/:showId/seats" element={<AdminShowSeats />} />
              </Route>
            </Routes>
            </PageTransition>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
