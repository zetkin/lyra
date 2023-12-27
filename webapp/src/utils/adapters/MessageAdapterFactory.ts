import TsMessageAdapter from '@/utils/adapters/TsMessageAdapter';
import YamlMessageAdapter from '@/utils/adapters/YamlMessageAdapter';
import { LyraProjectConfig, MessageKind } from '@/utils/LyraConfig';

export default class MessageAdapterFactory {
  static createAdapter(config: LyraProjectConfig) {
    if (config.messageKind == MessageKind.TS) {
      return new TsMessageAdapter(config.messagesPath);
    } else {
      return new YamlMessageAdapter(config.messagesPath);
    }
  }
}
