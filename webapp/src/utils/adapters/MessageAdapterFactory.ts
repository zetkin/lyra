import TSMessageAdapter from './TSMessageAdapter';
import YAMLMessageAdapter from './YAMLMessageAdapter';
import LyraConfig, { MessageKind } from '../config';

export default class MessageAdapterFactory {
  static createAdapter(config: LyraConfig) {
    // TODO: make it multi projects
    if (config.projects[0].messageKind == MessageKind.TS) {
      return new TSMessageAdapter(config.projects[0].messagesPath);
    } else {
      return new YAMLMessageAdapter(config.projects[0].messagesPath);
    }
  }
}
