'use client';

import { type ProjectsResponse } from '@/types';
import { useEffect, useState } from 'react';

export default function Home() {
  const [projects, setProjects] = useState<ProjectsResponse>([]);

  useEffect(() => {
    async function loadProjects() {
      const res = await fetch('/api/projects');
      const payload = await res.json();
      setProjects(payload);
    }

    loadProjects();
  }, []);

  return (
    <main>
      <h1>Projects</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.name} className="project-item">
            <h2>{project.name}</h2>
          </li>
        ))}
      </ul>
    </main>
  );
}
