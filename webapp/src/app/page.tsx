import { accessProjects } from '@/dataAccess';
import { Promises } from '@/utils/Promises';
import HomeDashboard from '@/components/HomeDashboard';

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
  const projectData = await accessProjects();
  const projects = await new Promises(projectData)
    .map(async ({ name, messages, languagesWithTranslations }) => {
      const languages = await new Promises(languagesWithTranslations)
        .map(({ lang, translations }) => ({
          href: `/projects/${name}/${lang}`,
          language: lang,
          progress: translations
            ? (Object.keys(translations).length / messages.length) * 100
            : 0,
        }))
        .all();

      return {
        href: `/projects/${name}`,
        languages,
        messageCount: messages.length,
        name,
      };
    })
    .all();

  return <HomeDashboard projects={projects} />;
}
