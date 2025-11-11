import { IGenerator } from '@tg-scripts/types';
import { supportedConfigs } from '../../io/cli/config';
import { promptUser, promptText } from '../../io/utils';

export type ConfigFileGeneratorConfig = {
  type: 'commonjs' | 'module';
  extension: 'ts' | 'js';
}

export interface ConfigFileGeneratorInput {
  requireAdmin?: boolean | undefined;
}

export class ConfigFileGenerator implements IGenerator<ConfigFileGeneratorInput, string> {
  private readonly config: ConfigFileGeneratorConfig;
  constructor(config: ConfigFileGeneratorConfig) {
    this.config = config;
  }

  // Interactive wizard - dynamically generated from supportedConfigs
  private async ask(): Promise<Record<string, any>> {
    const answers: Record<string, any> = {};

    // Helper to get default value
    const getDefaultValue = (config: (typeof supportedConfigs)[number]): any => {
      if (typeof config.defaultValue === 'function') {
        return config.example;
      }
      return config.defaultValue;
    };

    // Only prompt for commonly configured fields during init
    // Skip complex fields like guards, adminGuards, components
    const promptableConfigs = supportedConfigs.filter((config) => {
      // Skip object types and Guard[] types (too complex for init wizard)
      if (config.type === 'object' || config.type === 'Guard[]') {
        return false;
      }
      // Skip non-required fields that are auto-discovered or rarely changed
      if (!config.required && config.name.includes('appModule')) {
        return false;
      }
      if (!config.required && config.name.includes('AppComponent')) {
        return false;
      }
      if (!config.required && config.name.includes('DataProvider')) {
        return false;
      }
      return true;
    });

    console.log(`\n📝 Configuration wizard (${promptableConfigs.length} settings)\n`);

    for (const config of promptableConfigs) {
      const defaultValue = getDefaultValue(config);
      const promptLabel = config.comment || config.description;

      // Use appropriate prompt based on type
      switch (config.type) {
        case 'boolean':
          answers[config.name] = await promptUser(`${promptLabel}? (y/n): `, { defaultValue });
          break;

        case 'string':
          answers[config.name] = await promptText(promptLabel, { defaultValue });
          break;

        case 'string[]':
          // For string arrays, prompt for comma-separated values
          const arrayDefault = Array.isArray(defaultValue) ? defaultValue.join(', ') : '';
          const arrayInput = await promptText(`${promptLabel} (comma-separated)`, { defaultValue: arrayDefault });
          answers[config.name] = arrayInput
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          break;

        default:
          answers[config.name] = await promptText(promptLabel, { defaultValue: String(defaultValue) });
      }
    }

    return answers;
  }

  private buildConfigTemplate(values?: Record<string, any>): string {
    // Helper to format a value based on its type
    const formatValue = (value: any, type: string): string => {
      if (value === null || value === undefined) {
        return 'undefined';
      }

      switch (type) {
        case 'string':
          return `'${value}'`;
        case 'boolean':
          return value ? 'true' : 'false';
        case 'string[]':
          if (Array.isArray(value)) {
            return `[${value.map((v) => `'${v}'`).join(', ')}]`;
          }
          return '[]';
        case 'Guard[]':
          if (Array.isArray(value) && value.length > 0) {
            return `[\n        ${value.map((g: any) => `{ name: '${g.name}', importPath: '${g.importPath}' }`).join(',\n        ')},\n      ]`;
          }
          return '[]';
        case 'object':
          if (typeof value === 'object' && !Array.isArray(value)) {
            return JSON.stringify(value, null, 2)
              .split('\n')
              .map((line, i) => (i === 0 ? line : `    ${line}`))
              .join('\n');
          }
          return '{}';
        default:
          return String(value);
      }
    };

    // Helper to get default value
    const getDefaultValue = (config: (typeof supportedConfigs)[number]): any => {
      if (typeof config.defaultValue === 'function') {
        // For function defaults, use the example value instead
        return config.example;
      }
      return config.defaultValue;
    };

    // Helper to resolve value with override or default
    const resolveValue = (config: (typeof supportedConfigs)[number]): any => {
      const override = values?.[config.name];
      if (override !== undefined) {
        return override;
      }
      return getDefaultValue(config);
    };

    // Group configs by section
    const sections = new Map<string, (typeof supportedConfigs)[number][]>();
    for (const config of supportedConfigs) {
      const existing = sections.get(config.section) || [];
      existing.push(config);
      sections.set(config.section, existing);
    }

    // Build nested object structure
    const buildSection = (sectionConfigs: (typeof supportedConfigs)[number][], indent: string): string => {
      const lines: string[] = [];

      for (const config of sectionConfigs) {
        // Add comment if available
        if (config.comment) {
          const commentLines = config.comment.split('\n');
          for (const line of commentLines) {
            lines.push(`${indent}// ${line}`);
          }
        }

        // Get the last part of the fullPath for the field name
        const fieldName = config.fullPath.split('.').pop()!;
        const value = resolveValue(config);
        const formattedValue = formatValue(value, config.type);

        lines.push(`${indent}${fieldName}: ${formattedValue},`);
        lines.push('');
      }

      return lines.join('\n');
    };

    // Build the config structure
    let configContent = `import type { Config } from '@tgraph/backend-generator';

export const config: Config = {
  // ============================================================================
  // INPUT: Where to read from
  // ============================================================================
  input: {
    prisma: {
${buildSection(sections.get('input.prisma') || [], '      ')}    },
    dashboard: {
${buildSection(sections.get('input.dashboard') || [], '      ')}    },
  },

  // ============================================================================
  // OUTPUT: Where to write generated files
  // ============================================================================
  output: {
    backend: {
${buildSection(sections.get('output.backend') || [], '      ')}    },
    dashboard: {
${buildSection(sections.get('output.dashboard') || [], '      ')}    },
  },

  // ============================================================================
  // API: Backend API generation settings
  // ============================================================================
  api: {
${buildSection(sections.get('api') || [], '    ')}  },

  // ============================================================================
  // BEHAVIOR: CLI and generation behavior
  // ============================================================================
  behavior: {
${buildSection(sections.get('behavior') || [], '    ')}  },
};
`;

    return configContent;
  }

  public async generate(options?: ConfigFileGeneratorInput): Promise<string> {
    try {
      // Ask whether to use defaults or run wizard
      const runWizard = await promptUser('Run interactive init wizard? (y/n): ', { defaultValue: true });
      const answers = runWizard ? await this.ask() : undefined;

      // Apply CLI overrides if provided
      const finalAnswers = { ...answers };

      // Apply requireAdmin override if provided via CLI (--requireAdmin flag)
      if (options?.requireAdmin !== undefined) {
        // Find the requireAdmin config to get its name
        const requireAdminConfig = supportedConfigs.find((c) => c.fullPath === 'api.requireAdmin');
        if (requireAdminConfig) {
          finalAnswers[requireAdminConfig.name] = options.requireAdmin;
        }
      }

      const content = this.buildConfigTemplate(Object.keys(finalAnswers).length > 0 ? finalAnswers : undefined);
      return content;
    } catch (error) {
      console.error(`❌ Error creating configuration file:`, error);
      throw new Error(`Error creating configuration file: ${error}`);
    }
  }
}
