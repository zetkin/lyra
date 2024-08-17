'use client';

import { FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view';
import { TreeItem2 } from '@mui/x-tree-view/TreeItem2';

import { MessageData } from '@/utils/adapters';
import { type UnflattenObject, unflattenObject } from '@/utils/unflattenObject';

type MessageTreeProps = {
  languageName: string;
  messageId?: string;
  messages: MessageData[];
  projectName: string;
};

const MessageTree: FC<MessageTreeProps> = ({
  languageName,
  messageId,
  messages,
  projectName,
}) => {
  const router = useRouter();

  const tree = useMemo(() => {
    const record = messages.reduce(
      (acc, msg) => {
        acc[msg.id] = msg.id;
        return acc;
      },
      {} as Record<string, string>,
    );
    const unflattened = unflattenObject(record);

    function recurse(
      obj: UnflattenObject | string,
      prefix: string,
    ): TreeViewBaseItem[] {
      if (typeof obj === 'string') {
        return [];
      }
      return Object.keys(obj).map((key) => {
        const id = prefix ? `${prefix}.${key}` : key;
        const children = recurse(obj[key], id);
        return {
          children: children.length ? children : undefined,
          id,
          label: key,
        };
      });
    }

    return recurse(unflattened, '');
  }, [messages]);

  const onItemSelectionToggle = useCallback(
    (e: React.SyntheticEvent, id: string, isSelected: boolean) => {
      if (isSelected) {
        router.push(`/projects/${projectName}/${languageName}/${id}`, {});
      }
    },
    [languageName, projectName, router],
  );

  const defaultExpandedItems = useMemo(() => {
    if (!messageId) {
      return [];
    }
    const parts = messageId.split('.');
    for (let i = 1; i < parts.length; i++) {
      parts[i] = `${parts[i - 1]}.${parts[i]}`;
    }
    return parts;
  }, [messageId]);

  return (
    <RichTreeView
      defaultExpandedItems={defaultExpandedItems}
      items={tree}
      onItemSelectionToggle={onItemSelectionToggle}
      slots={{ item: TreeItem2 }}
      sx={{ overflowY: 'auto' }}
    />
  );
};

export default MessageTree;
