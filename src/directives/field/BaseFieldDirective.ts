import type { PrismaField, FieldDirective } from '@tg-scripts/types';

export abstract class BaseFieldDirective implements FieldDirective {
  protected abstract pattern: RegExp;
  abstract readonly name: string;
  protected abstract applyMatch(field: PrismaField, match: RegExpMatchArray): void;

  protected ensureDirectiveStore(field: PrismaField): Record<string, unknown> {
    if (!field.directives) {
      field.directives = {};
    }
    if (!field.directives[this.name]) {
      field.directives[this.name] = {};
    }
    return field.directives[this.name] as Record<string, unknown>;
  }

  apply(field: PrismaField, sourceText: string): void {
    if (!sourceText) {
      return;
    }

    const matches = sourceText.matchAll(this.pattern);
    for (const match of matches) {
      this.applyMatch(field, match);
    }
  }
}
