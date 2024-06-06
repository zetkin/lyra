'use client';

import { type ProjectsResponse } from '@/types';
import { useEffect, useState } from 'react';

export default function Home() {
  const [projectsResponse, setProjectsResponse] = useState<ProjectsResponse>({
    projects: [],
  });

  useEffect(() => {
    async function loadProjects() {
      const res = await fetch('/api/projects');
      const payload = await res.json();
      setProjectsResponse(payload);
    }

    loadProjects();
  }, []);

  return (
    <main>
      <h1>Projects</h1>
      <ul>
        {projectsResponse.projects.map((project) => (
          <li key={project.name} className="project-item">
            <h2>{project.name}</h2>
            <p>owner: {project.owner}</p>
            <p>repo: {project.repo}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
