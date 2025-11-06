import type { PrismaField } from '@tg-scripts/types';
import { BaseFieldDirective } from '../BaseFieldDirective';

export class TgReadOnlyDirective extends BaseFieldDirective {
  protected pattern = /@tg_readonly\b/g;
  readonly name = 'tg_readonly';
  protected applyMatch(field: PrismaField): void {
    field.tgReadOnly = true;
    const store = this.ensureDirectiveStore(field);
    store.enabled = true;
  }
}
