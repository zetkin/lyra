import { type MessageData } from '.';
import mock from 'mock-fs';
import TsMessageAdapter from './TsMessageAdapter';
import { afterEach, describe, expect, it } from '@jest/globals';

describe('TsMessageAdapter', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('getMessages()', () => {
    it('Finds messageIds.ts file and parses it', async () => {
      mock({
        'src/features/something/messageIds.ts': [
          `import { m, makeMessages } from 'core/i18n';`,
          `export default makeMessages('feat.something', {`,
          `  label: m<{ adjective: string }>('My {adjective} feature'),`,
          `});`,
        ].join('\n'),
      });

      const msgAdapter = new TsMessageAdapter();
      const messages = await msgAdapter.getMessages();

      expect(messages).toEqual(<MessageData[]>[
        {
          defaultMessage: 'My {adjective} feature',
          id: 'feat.something.label',
          params: [
            {
              name: 'adjective',
              types: ['string'],
            },
          ],
        },
      ]);
    });

    it('Finds multiple messageIds files', async () => {
      mock({
        'src/features/other/messageIds.ts': [
          `import { m, makeMessages } from 'core/i18n';`,
          `export default makeMessages('feat.other', {`,
          `  label: m('My other feature'),`,
          `});`,
        ].join('\n'),
        'src/features/something/messageIds.ts': [
          `import { m, makeMessages } from 'core/i18n';`,
          `export default makeMessages('feat.something', {`,
          `  label: m<{ adjective: string }>('My {adjective} feature'),`,
          `});`,
        ].join('\n'),
      });

      const msgAdapter = new TsMessageAdapter();
      const messages = await msgAdapter.getMessages();

      expect(messages).toEqual(<MessageData[]>[
        {
          defaultMessage: 'My other feature',
          id: 'feat.other.label',
          params: [],
        },
        {
          defaultMessage: 'My {adjective} feature',
          id: 'feat.something.label',
          params: [{ name: 'adjective', types: ['string'] }],
        },
      ]);
    });

    it('Finds messageIds files using absolute paths', async () => {
      mock({
        '/path/to/src/features/something/messageIds.ts': [
          `import { m, makeMessages } from 'core/i18n';`,
          `export default makeMessages('feat.something', {`,
          `  label: m<{ adjective: string }>('My {adjective} feature'),`,
          `});`,
        ].join('\n'),
      });

      const msgAdapter = new TsMessageAdapter('/path/to/src');
      const messages = await msgAdapter.getMessages();

      expect(messages).toEqual(<MessageData[]>[
        {
          defaultMessage: 'My {adjective} feature',
          id: 'feat.something.label',
          params: [
            {
              name: 'adjective',
              types: ['string'],
            },
          ],
        },
      ]);
    });
  });
});
