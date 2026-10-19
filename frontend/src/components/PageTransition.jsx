import React from 'react';
import { useLocation } from 'react-router-dom';

/** Fades each page in when the route changes. */
const PageTransition = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
};

export default PageTransition;
