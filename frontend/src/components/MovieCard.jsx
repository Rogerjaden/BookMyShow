import React from 'react';
import { Box, Card, CardActionArea, CardContent, CardMedia, Chip, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TranslateIcon from '@mui/icons-material/Translate';

// Inline poster used when a movie has none, or its image fails to load.
// (via.placeholder.com is offline, so a hosted placeholder would show a broken image.)
const DEFAULT_POSTER = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a30"/><stop offset="1" stop-color="#17171a"/></linearGradient></defs>' +
    '<rect width="300" height="420" fill="url(#g)"/>' +
    '<g fill="none" stroke="#5a5a64" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="100" y="150" width="100" height="80" rx="10"/><path d="M110 150l12-22M140 150l12-22M170 150l12-22"/></g>' +
    '<text x="150" y="275" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#8a8a94">No poster yet</text></svg>'
)}`;

const STATUS_COLOR = { NOW_SHOWING: 'success', COMING_SOON: 'warning' };

const formatDuration = (minutes) => {
  if (!minutes) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

const MovieCard = ({ movie, onClick }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.paper',
      transition: 'transform 220ms cubic-bezier(.2,.9,.3,1), box-shadow 220ms ease',
      '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 14px 30px rgba(0,0,0,0.5)' },
      '&:hover .poster': { transform: 'scale(1.06)' },
      '&:hover .cta': { opacity: 1, transform: 'translateY(0)' },
    }}
  >
    <CardActionArea
      onClick={onClick}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
    >
      <Box sx={{ position: 'relative', paddingTop: '140%', width: '100%', overflow: 'hidden', bgcolor: '#17171a' }}>
        <CardMedia
          className="poster"
          component="img"
          loading="lazy"
          image={movie?.posterUrl || DEFAULT_POSTER}
          alt={movie?.title ? `${movie.title} poster` : 'Movie poster'}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_POSTER;
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 500ms cubic-bezier(.2,.9,.3,1)',
          }}
        />
        {movie?.status && (
          <Chip
            label={movie.status.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            color={STATUS_COLOR[movie.status] || 'default'}
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 700, fontSize: 11, boxShadow: 2 }}
          />
        )}
        {/* Slides up on hover: tells you what the card does */}
        <Box
          className="cta"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            py: 1.25,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            background: 'linear-gradient(to top, rgba(229,57,53,0.95), rgba(229,57,53,0.75))',
            opacity: 0,
            transform: 'translateY(100%)',
            transition: 'opacity 220ms ease, transform 260ms cubic-bezier(.2,.9,.3,1)',
            display: { xs: 'none', md: 'block' },
          }}
        >
          See showtimes
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          variant="h6"
          component="div"
          title={movie?.title}
          sx={{
            fontSize: '1.05rem',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {movie?.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary', fontSize: 13 }}>
          {movie?.language && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TranslateIcon sx={{ fontSize: 15 }} />
              <span>{movie.language}</span>
            </Box>
          )}
          {movie?.durationMinutes && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 15 }} />
              <span>{formatDuration(movie.durationMinutes)}</span>
            </Box>
          )}
          {movie?.certificate && (
            <Chip label={movie.certificate} size="small" variant="outlined" sx={{ height: 20, fontSize: 11, ml: 'auto' }} />
          )}
        </Box>

        {movie?.genres?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto', pt: 1 }}>
            {movie.genres.slice(0, 3).map((g) => (
              <Chip
                key={g.id || g.name}
                label={g.name}
                size="small"
                sx={{ fontSize: 11, height: 22, backgroundColor: 'rgba(255,255,255,0.08)' }}
              />
            ))}
            {movie.genres.length > 3 && (
              <Chip
                label={`+${movie.genres.length - 3}`}
                size="small"
                sx={{ fontSize: 11, height: 22, backgroundColor: 'rgba(255,255,255,0.05)' }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </CardActionArea>
  </Card>
);

export default MovieCard;
