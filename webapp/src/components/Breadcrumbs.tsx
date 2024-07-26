import { FC, useMemo } from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link } from '@mui/material';

type BreadcrumbsProps = {
  languageName: string;
  messageId?: string;
  projectName: string;
};

type Breadcrumb = {
  href: string;
  last: boolean;
  text: string;
};

const Breadcrumbs: FC<BreadcrumbsProps> = ({
  languageName,
  messageId,
  projectName,
}) => {
  const breadcrumbs: Breadcrumb[] = useMemo(() => {
    const parts = messageId?.split('.') || [];
    return parts.map((part, i) => {
      const href = `/projects/${projectName}/${languageName}/${parts
        .slice(0, i + 1)
        .join('.')}`;
      return {
        href,
        last: i === parts.length - 1,
        text: part,
      };
    });
  }, [languageName, messageId, projectName]);

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
