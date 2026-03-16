'use client';

import React, { FC, useEffect, useMemo, useState } from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeViewBaseItem } from '@mui/x-tree-view';
import { TreeItem2 } from '@mui/x-tree-view/TreeItem2';

import { type UnflattenObject, unflattenObject } from '@/utils/unflattenObject';
import { Message } from '@/api/generated';

type MessageTreeProps = {
  messageId?: string;
  messages: Message[];
  onItemSelectionToggle: (
    e: React.SyntheticEvent,
    id: string,
    isSelected: boolean,
  ) => void;
};

const MessageTree: FC<MessageTreeProps> = ({
  messageId,
  messages,
  onItemSelectionToggle,
}) => {
  const tree = useMemo(() => {
    const record = messages.reduce(
      (acc, msg) => {
        acc[msg.i18nKey] = msg.i18nKey;
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

  const ancestorsOf = (id: string): string[] => {
    const parts = id.split('.');
    for (let i = 1; i < parts.length; i++) {
      parts[i] = `${parts[i - 1]}.${parts[i]}`;
    }
    return parts;
  };

  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    messageId ? ancestorsOf(messageId) : [],
  );

  useEffect(() => {
    if (!messageId) {
      return;
    }
    const ancestors = ancestorsOf(messageId);
    setExpandedItems((prev) => {
      const missing = ancestors.filter((a) => !prev.includes(a));
      return missing.length ? [...prev, ...missing] : prev;
    });
  }, [messageId]);

  return (
    <RichTreeView
      expandedItems={expandedItems}
      items={tree}
      onExpandedItemsChange={(_e, items) => setExpandedItems(items)}
      onItemSelectionToggle={onItemSelectionToggle}
      slots={{ item: TreeItem2 }}
      sx={{ overflowY: 'auto' }}
    />
  );
};

export default MessageTree;
