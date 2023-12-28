'use client';

import { type ProjectItem } from '@/types';
import { useEffect, useState } from 'react';

export default function Home() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    async function loadProjects() {
      const res = await fetch('/api/projects');
      const payload = await res.json();
      setProjects(payload.projects);
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
            <p>host: {project.host}</p>
            <p>owner: {project.owner}</p>
            <p>repo: {project.repo}</p>
            <p>Project path: {project.projectPath}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
