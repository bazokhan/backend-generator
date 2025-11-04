import type { PrismaField } from '@tg-scripts/types';
import { BaseFieldDirective } from '../BaseFieldDirective';

type SupportedFormats = 'url' | 'email' | 'password' | 'tel';

export class TgFormatDirective extends BaseFieldDirective {
  readonly name = 'tg_format';
  protected pattern = /@tg_format\((url|email|password|tel)\)/g;

  protected applyMatch(field: PrismaField, match: RegExpMatchArray): void {
    const format = match[1] as SupportedFormats;
    field.tgFormat = format;
    const store = this.ensureDirectiveStore(field);
    store.type = format;
  }
}
