'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    async function loadProjects() {
      const res = await fetch('/api/projects');
      await res.json();
    }

    loadProjects();
  }, []);

  return (
    <main>
      <h1>Projects</h1>
    </main>
  );
}
