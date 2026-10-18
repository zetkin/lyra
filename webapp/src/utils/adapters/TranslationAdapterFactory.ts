import JsonTranslationAdapter from './JsonTranslationAdapter';
import YamlTranslationAdapter from './YamlTranslationAdapter';
import { ITranslationAdapter } from '.';
import { LyraProjectConfig, TranslationKind } from '../lyraConfig';

export default class TranslationAdapterFactory {
  static createAdapter(lpConfig: LyraProjectConfig): ITranslationAdapter {
    if (lpConfig.translationKind == TranslationKind.JSON) {
      return new JsonTranslationAdapter(lpConfig.absTranslationsPath);
    } else {
      return new YamlTranslationAdapter(lpConfig.absTranslationsPath);
    }
  }
}
