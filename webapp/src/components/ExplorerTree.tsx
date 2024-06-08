'use client';

import Link from 'next/link';
import { MessageData } from '@/utils/adapters';
import { unflattenObject } from '@/utils/unflattenObject';
import { FC, useMemo } from 'react';

type ExplorerTreeProps = {
  languageName: string;
  messages: MessageData[];
  projectName: string;
};

const ExplorerTree: FC<ExplorerTreeProps> = ({
  languageName,
  messages,
  projectName,
}) => {
  const tree = useMemo(() => {
    const record = messages.reduce(
      (acc, msg) => {
        acc[msg.id] = msg.id;
        return acc;
      },
      {} as Record<string, string>,
    );
    return unflattenObject(record);
  }, [messages]);

  return (
    <ExplorerTreeNode
      languageName={languageName}
      node={tree}
      prefix=""
      projectName={projectName}
    />
  );
};

type Node = { [key: string]: Node };

const ExplorerTreeNode: FC<{
  languageName: string;
  node: Node;
  prefix: string;
  projectName: string;
}> = ({ languageName, node, prefix, projectName }) => {
  return (
    <ul style={{ listStyleType: 'none', paddingLeft: 10 }}>
      {Object.entries(node)
        .filter(([, value]) => typeof value !== 'string')
        .map(([key, value]) => (
          <li key={key}>
            <Link
              href={
                prefix
                  ? `/projects/${projectName}/${languageName}/${prefix}.${key}`
                  : `/projects/${projectName}/${languageName}/${key}`
              }
              style={{ color: 'blue' }}
            >
              {key}
            </Link>
            {typeof value === 'object' ? (
              <ExplorerTreeNode
                languageName={languageName}
                node={value}
                prefix={prefix ? `${prefix}.${key}` : key}
                projectName={projectName}
              />
            ) : null}
          </li>
        ))}
    </ul>
  );
};

export default ExplorerTree;
