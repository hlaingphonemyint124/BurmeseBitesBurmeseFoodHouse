import React from 'react';

/* Lightweight branded loader shown briefly while a route's code chunk
   downloads (React.lazy + Suspense). Kept intentionally tiny/dependency-free
   so it never itself becomes something worth lazy-loading. */
export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="page-loader__ring" />
    </div>
  );
}
