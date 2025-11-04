import type { PrismaField, FieldDirective } from '@tg-scripts/types';
import { TgFormatDirective } from './directives/TgFormatDirective';
import { TgUploadDirective } from './directives/TgUploadDirective';
import { TgReadOnlyDirective } from './directives/TgReadOnlyDirective';

export class FieldDirectiveManager {
  constructor(private readonly directives: FieldDirective[]) {}

  apply(field: PrismaField, sourceText: string): void {
    if (!sourceText) {
      return;
    }

    this.directives.forEach((directive) => directive.apply(field, sourceText));
  }
}

export const fieldDirectiveManager = new FieldDirectiveManager([
  new TgFormatDirective(),
  new TgUploadDirective(),
  new TgReadOnlyDirective(),
]);
