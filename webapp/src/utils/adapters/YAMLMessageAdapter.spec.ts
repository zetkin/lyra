import { afterEach, describe, it, expect } from '@jest/globals';
import mock from 'mock-fs';

import YAMLMessageAdapter from './YAMLMessageAdapter';
import { MessageData } from '../readTypedMessages';

describe('YAMLMessageAdapter', () => {
  describe('getMessages()', () => {
    afterEach(() => {
      mock.restore();
    });

    it('loads messages from YAML file in root', async () => {
      mock({
        'locale/en.yml': [
          // Simple YAML
          'box:',
          '  button: OK',
          '  h: Action completed',
        ].join('\n'),
      });

      const msgAdapter = new YAMLMessageAdapter();
      const messages = await msgAdapter.getMessages();

      expect(messages).toEqual(<MessageData[]>[
        {
          defaultMessage: 'OK',
          id: 'box.button',
          params: [],
        },
        {
          defaultMessage: 'Action completed',
          id: 'box.h',
          params: [],
        },
      ]);
    });

    it('loads messages from YAML file in directory', async () => {
      mock({
        'locale/my/feature/en.yml': [
          // YAML
          'box:',
          '  button: OK',
        ].join('\n'),
      });

      const msgAdapter = new YAMLMessageAdapter();
      const messages = await msgAdapter.getMessages();

      expect(messages).toEqual(<MessageData[]>[
        {
          defaultMessage: 'OK',
          id: 'my.feature.box.button',
          params: [],
        },
      ]);
    });

    it('loads messages from multiple YAML files and overlays them', async () => {
      mock({
        'locale/my/feature/en.yml': [
          // YAML
          'box:',
          '  button: OK',
        ].join('\n'),
        'locale/my/other/feature/en.yml': 'title: Clara',
      });

      const msgAdapter = new YAMLMessageAdapter();
      const messages = await msgAdapter.getMessages();

      expect(messages).toEqual(<MessageData[]>[
        {
          defaultMessage: 'OK',
          id: 'my.feature.box.button',
          params: [],
        },
        {
          defaultMessage: 'Clara',
          id: 'my.other.feature.title',
          params: [],
        },
      ]);
    });
  });
});
