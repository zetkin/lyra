'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    async function loadProjects() {
      await fetch('/api/projects');
    }

    loadProjects();
  }, []);

  return (
    <main>
      <h1>Projects</h1>
    </main>
  );
}
