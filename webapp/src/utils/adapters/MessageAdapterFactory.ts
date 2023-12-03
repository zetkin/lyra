import LyraConfig, { MessageKind } from '../config';
import TSMessageAdapter from './TSMessageAdapter';
import YAMLMessageAdapter from './YAMLMessageAdapter';

export default class MessageAdapterFactory {
  static createAdapter(config: LyraConfig) {
    if (config.messageKind == MessageKind.TS) {
      return new TSMessageAdapter(config.messagesPath);
    } else {
      return new YAMLMessageAdapter(config.messagesPath);
    }
  }
}
