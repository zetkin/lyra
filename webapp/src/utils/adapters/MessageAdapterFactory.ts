import TsMessageAdapter from './TsMessageAdapter';
import YamlMessageAdapter from './YamlMessageAdapter';
import LyraConfig, { MessageKind } from '../config';

export default class MessageAdapterFactory {
  static createAdapter(config: LyraConfig) {
    // TODO: make it multi projects
    if (config.projects[0].messageKind == MessageKind.TS) {
      return new TsMessageAdapter(config.projects[0].messagesPath);
    } else {
      return new YamlMessageAdapter(config.projects[0].messagesPath);
    }
  }
}
