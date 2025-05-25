'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const treeRef = useRef<HTMLUListElement>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
      const newPathname = `/projects/${projectName}/${languageName}/${id}`;
      if (loading || pathname === newPathname) {
        return;
      }
      if (isSelected) {
        if (treeRef.current) {
          localStorage.setItem(
            'MessageTree.ScrollPosition',
            treeRef.current.scrollTop.toString(),
          );
        }
        setLoading(true);
        router.push(`/projects/${projectName}/${languageName}/${id}`, {});
      }
    },
    [languageName, loading, pathname, projectName, router],
  );

  useEffect(() => {
    const storedScroll = localStorage.getItem('MessageTree.ScrollPosition');
    if (storedScroll && treeRef.current) {
      treeRef.current.scrollTop = parseInt(storedScroll, 10);
    }
  }, []);

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
      ref={treeRef}
      defaultExpandedItems={defaultExpandedItems}
      defaultSelectedItems={messageId}
      isItemDisabled={() => loading}
      items={tree}
      onItemSelectionToggle={onItemSelectionToggle}
      slots={{ item: TreeItem2 }}
      sx={{ overflowY: 'auto' }}
    />
  );
};

export default MessageTree;
