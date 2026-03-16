import { create } from 'zustand';

import { Message, PagedMessages } from '@/api/generated';
import { api } from '@/api';

type SaveTranslationPayload = {
  i18nKey: string;
  lang: string;
  projectId: number;
  repositoryName: string;
  translation: string;
};

export type FetchMessageProps = {
  lang: string;
  limit: number;
  messageId?: string;
  offset: number;
  projectId: number;
  repositoryName: string;
  search?: string;
};

type MessageState = {
  addMessage: (message: Message, lang: string) => void;
  addMessages: (message: Message[], lang: string) => void;
  fetchMessages: (props: FetchMessageProps) => Promise<Message[]>;
  findMessage: (
    projectId: number,
    i18nKey: string,
    lang?: string,
  ) => Message | undefined;
  saveTranslation: (
    payload: SaveTranslationPayload,
  ) => Promise<Message | undefined>;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  messages: Message[];
  pagedMessages: PagedMessages[];
};

const sortForLanguage = (messages: Message[], lang: string): Message[] =>
  messages.sort((m1, m2) => {
    const m1IsTranslated = m1.translations[lang] !== undefined;
    const m2IsTranslated = m2.translations[lang] !== undefined;
    if (m1IsTranslated && !m2IsTranslated) {
      return -1;
    }
    if (!m1IsTranslated && m2IsTranslated) {
      return 1;
    }
    return 0;
  });

export const useMessageStore = create<MessageState>((set, get) => ({
  addMessage: (message, lang) => {
    if (get().findMessage(message.projectId, message.i18nKey)) {
      // do not add the message, to avoid duplicate items
      return;
    }
    set((state) => ({
      messages: sortForLanguage([...state.messages, message], lang),
    }));
  },
  addMessages: (messages, lang) => {
    const nonDuplicates = messages.filter(
      (msg) => get().findMessage(msg.projectId, msg.i18nKey) !== undefined,
    );
    set((state) => ({
      messages: sortForLanguage([...state.messages, ...nonDuplicates], lang),
    }));
  },
  fetchMessages: async (props) => {
    const { offset, limit } = props;
    if (props.messageId) {
      const messages = await api.getMessagesWithMessageId({
        ...props,
        messageId: props.messageId,
      });
      get().addMessages(messages.items, props.lang);
      return messages.items;
    }
    let pagedMessages = get().pagedMessages.find(
      (pagedMessages) =>
        pagedMessages.offset === offset && pagedMessages.limit === limit,
    );
    if (pagedMessages) {
      // already called with same limit and offset - no need fo fetch again
      return pagedMessages.items;
    }
    pagedMessages = await api.getMessages(props);
    get().addMessages(pagedMessages.items, props.lang);
    set((state) => ({
      ...state,
      pagedMessages: [...state.pagedMessages, pagedMessages as PagedMessages],
    }));
    return pagedMessages.items;
  },
  findMessage: (projectId, i18nKey, lang) =>
    get().messages.find((msg) => {
      if (!lang) {
        return msg.i18nKey === i18nKey && msg.projectId === projectId;
      }
      return (
        msg.i18nKey === i18nKey &&
        msg.projectId === projectId &&
        Object.keys(msg).includes(lang)
      );
    }),
  saveTranslation: async ({
    repositoryName,
    projectId,
    i18nKey,
    lang,
    translation,
  }) => {
    const msg = await api.submitTranslation({
      i18nKey,
      lang,
      projectId,
      repositoryName,
      translationRequest: { text: translation },
    });

    // filter out the old message that didn't include the message
    set((state) => ({
      ...state,
      messages: state.messages.filter((m) => m.i18nKey !== msg.i18nKey),
    }));
    // add the new message
    set((state) => ({ ...state, messages: [...state.messages, msg] }));
    return msg;
  },
  // eslint-disable-next-line sort-keys
  messages: [],
  pagedMessages: [],
}));
