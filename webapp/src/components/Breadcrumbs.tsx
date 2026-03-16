import { FC, useMemo } from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link } from '@mui/material';

type BreadcrumbsProps = {
  languageName: string;
  messageId?: string;
  projectId: number;
  repositoryName: string;
};

type Breadcrumb = {
  href: string;
  last: boolean;
  text: string;
};

const Breadcrumbs: FC<BreadcrumbsProps> = ({
  languageName,
  messageId,
  projectId,
  repositoryName,
}) => {
  const breadcrumbs: Breadcrumb[] = useMemo(() => {
    const parts = messageId?.split('.') || [];
    return parts.map((part, i) => {
      const i18nKey = parts.slice(0, i + 1).join('.');
      const href = `/repository/${repositoryName}/projects/${projectId}/${i18nKey}/${languageName}`;
      return {
        href,
        last: i === parts.length - 1,
        text: part,
      };
    });
  }, [languageName, messageId, projectId, repositoryName]);

  return (
    <MuiBreadcrumbs
      aria-label="Breadcrumb navigation"
      sx={{
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {breadcrumbs.map((breadcrumb) => (
        <Link
          key={breadcrumb.href}
          color={breadcrumb.last ? 'text.primary' : 'text.secondary'}
          href={breadcrumb.href}
          underline="hover"
        >
          {breadcrumb.text}
        </Link>
      ))}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;
