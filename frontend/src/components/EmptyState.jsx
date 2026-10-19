import React from 'react';
import { Box, Typography } from '@mui/material';

/** An empty list is an invitation to act: say what's missing and offer the next step. */
const EmptyState = ({ icon, title, description, action }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: { xs: 6, md: 9 },
      px: 2,
      border: '1px dashed rgba(255,255,255,0.16)',
      borderRadius: 3,
      animation: 'popIn 400ms cubic-bezier(.2,.9,.3,1.2) both',
    }}
  >
    {icon && <Box sx={{ color: 'text.disabled', mb: 1.5, '& svg': { fontSize: 56 } }}>{icon}</Box>}
    <Typography variant="h6" sx={{ mb: 0.5 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: action ? 3 : 0 }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

export default EmptyState;
