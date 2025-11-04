import type { PrismaField, FieldDirective } from '@tg-scripts/types';

export abstract class BaseFieldDirective implements FieldDirective {
  abstract readonly name: string;
  protected abstract pattern: RegExp;

  apply(field: PrismaField, sourceText: string): void {
    if (!sourceText) {
      return;
    }

    const matches = sourceText.matchAll(this.pattern);
    for (const match of matches) {
      this.applyMatch(field, match);
    }
  }

  protected ensureDirectiveStore(field: PrismaField): Record<string, unknown> {
    if (!field.directives) {
      field.directives = {};
    }
    if (!field.directives[this.name]) {
      field.directives[this.name] = {};
    }
    return field.directives[this.name] as Record<string, unknown>;
  }

  protected abstract applyMatch(field: PrismaField, match: RegExpMatchArray): void;
}
