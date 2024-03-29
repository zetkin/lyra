import TsMessageAdapter from './TsMessageAdapter';
import YamlMessageAdapter from './YamlMessageAdapter';
import { LyraProjectConfig, MessageKind } from '../lyraConfig';

export default class MessageAdapterFactory {
  static createAdapter(lpConfig: LyraProjectConfig) {
    if (lpConfig.messageKind == MessageKind.TS) {
      return new TsMessageAdapter(lpConfig.absMessagesPath);
    } else {
      return new YamlMessageAdapter(lpConfig.absMessagesPath);
    }
  }
}
