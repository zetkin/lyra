import TsMessageAdapter from './TsMessageAdapter';
import YamlMessageAdapter from './YamlMessageAdapter';
import { LyraProjectConfig, MessageKind } from '../lyraConfig';

export default class MessageAdapterFactory {
  static createAdapter(config: LyraProjectConfig) {
    if (config.messageKind == MessageKind.TS) {
      return new TsMessageAdapter(config.absMessagesPath);
    } else {
      return new YamlMessageAdapter(config.absMessagesPath);
    }
  }
}
