import type { PrismaField } from '@tg-scripts/types';
import { BaseFieldDirective } from '../BaseFieldDirective';

type UploadTypes = 'image' | 'file';

export class TgUploadDirective extends BaseFieldDirective {
  readonly name = 'tg_upload';
  protected pattern = /@tg_upload\((image|file)\)/g;

  protected applyMatch(field: PrismaField, match: RegExpMatchArray): void {
    const uploadType = match[1] as UploadTypes;
    field.tgUpload = uploadType;
    const store = this.ensureDirectiveStore(field);
    store.type = uploadType;
  }
}
