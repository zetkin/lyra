import MessageForm from '@/components/MessageForm';

const stories = {
  component: MessageForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'MessageForm',
};

export const Default = () => (
  <MessageForm
    message={{
      defaultMessage: 'message.defaultMessage',
      id: 'message.id',
      params: [],
    }}
    onSave={() => {}}
    translation="translation"
  />
);

export const LongDefaultMessage = () => (
  <MessageForm
    message={{
      defaultMessage:
        'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.',
      id: 'message.id',
      params: [],
    }}
    onSave={() => {}}
    translation="translation"
  />
);

export const LongTranslationString = () => (
  <MessageForm
    message={{
      defaultMessage: 'defaultMessage',
      id: 'message.id',
      params: [],
    }}
    onSave={() => {}}
    translation="Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation."
  />
);

export const LongDefaultAndTranslation = () => (
  <MessageForm
    message={{
      defaultMessage:
        'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.',
      id: 'message.id',
      params: [],
    }}
    onSave={() => {}}
    translation="Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation."
  />
);

export default stories;
