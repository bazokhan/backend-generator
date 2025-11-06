import type { Guard } from '@tg-scripts/types';

/**
 * GuardResolver handles resolution of authentication guards
 * for NestJS controller generation
 */
export class GuardResolver {
  private readonly guards: Guard[];
  private readonly enabled: boolean;

  constructor(guards: Guard[] = [], enabled: boolean = true) {
    this.guards = guards;
    this.enabled = enabled;
  }

  /**
   * Generate import statements for all guards
   * @returns Import statements as string array
   */
  generateImports(): string[] {
    if (!this.enabled || this.guards.length === 0) {
      return [];
    }

    return this.guards.map((guard) => `import { ${guard.name} } from '${guard.importPath}';`);
  }

  /**
   * Generate UseGuards decorator statement
   * @returns UseGuards decorator as string, or empty string if no guards
   */
  generateUseGuardsDecorator(): string {
    if (!this.enabled || this.guards.length === 0) {
      return '';
    }

    const guardNames = this.guards.map((guard) => guard.name).join(', ');
    return `@UseGuards(${guardNames})`;
  }

  /**
   * Get guard names as comma-separated string
   * @returns Guard names joined by comma
   */
  getGuardNames(): string {
    return this.guards.map((guard) => guard.name).join(', ');
  }

  /**
   * Get all guards
   * @returns Array of guards
   */
  getGuards(): Guard[] {
    return this.guards;
  }

  /**
   * Check if guards are enabled
   * @returns True if guards should be applied
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if any guards are configured
   * @returns True if at least one guard is configured
   */
  hasGuards(): boolean {
    return this.guards.length > 0;
  }

  /**
   * Generate guard imports for template variables
   * @returns Object with guardImports and guardNames for template rendering
   */
  getTemplateVariables(): { guardImports: string; guardNames: string } {
    const imports = this.generateImports().join('\n');
    const names = this.getGuardNames();

    return {
      guardImports: imports,
      guardNames: names,
    };
  }
}

