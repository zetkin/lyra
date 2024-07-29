import { Cache } from '@/Cache';
import HomeDashboard from '@/components/HomeDashboard';
import MessageAdapterFactory from '@/utils/adapters/MessageAdapterFactory';
import { ProjectCardProps } from '@/components/ProjectCard';
import { RepoGit } from '@/RepoGit';
import { ServerConfig } from '@/utils/serverConfig';

// Force dynamic rendering for this page. By default Next.js attempts to render
// this page statically. That means that it tries to render the page at build
// time instead of at runtime. That doesn't work: this page needs to fetch
// project-specific config files and perform git operations. So this little
// one-liner forces it into dynamic rendering mode.
//
// More info on dynamic vs static rendering at:
// https://nextjs.org/learn/dashboard-app/static-and-dynamic-rendering
//
// More info on `export const dynamic` at:
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

export default async function Home() {
  const serverConfig = await ServerConfig.read();
  const projects = await Promise.all(
    serverConfig.projects.map<Promise<ProjectCardProps>>(async (project) => {
      await RepoGit.cloneIfNotExist(project);
      const repoGit = await RepoGit.getRepoGit(project);
      const lyraConfig = await repoGit.getLyraConfig();
      const projectConfig = lyraConfig.getProjectConfigByPath(
        project.projectPath,
      );
      const msgAdapter = MessageAdapterFactory.createAdapter(projectConfig);
      const messages = await msgAdapter.getMessages();
      const store = await Cache.getProjectStore(projectConfig);
      const languages = await new Promises(
        projectConfig.languages.map(async (lang) => {
          const translations = await store.getTranslations(lang);
          return { lang, translations };
        }),
      )
        .map(({ lang, translations }) => {
          return {
            href: `/projects/${project.name}/${lang}`,
            language: lang,
            progress: translations
              ? (Object.keys(translations).length / messages.length) * 100
              : 0,
          };
        })
        .all();

      return {
        href: `/projects/${project.name}`,
        languages,
        messageCount: messages.length,
        name: project.name,
      };
    }),
  );

  return <HomeDashboard projects={projects} />;
}

class Promises<T> {
  constructor(private promises: Array<Promise<T>>) {}

  map<U>(callbackfn: (value: T) => U): Promises<U> {
    return new Promises(this.promises.map((p) => p.then(callbackfn)));
  }

  all() {
    return Promise.all(this.promises);
  }
}
