import TsMessageAdapter from './TsMessageAdapter';
import YamlMessageAdapter from './YamlMessageAdapter';
import { LyraProjectConfig, MessageKind } from '../config';

export default class MessageAdapterFactory {
  static createAdapter(config: LyraProjectConfig) {
    if (config.messageKind == MessageKind.TS) {
      return new TsMessageAdapter(config.messagesPath);
    } else {
      return new YamlMessageAdapter(config.messagesPath);
    }
  }
}
