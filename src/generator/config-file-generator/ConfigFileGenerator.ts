import { IGenerator } from '@tg-scripts/types';
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

  private async ask(): Promise<Record<string, any>> {
    const answers: Record<string, any> = {};

    console.log('\n📝 Configuration wizard (5 settings)\n');

    answers.schemaPath = await promptText('Path to Prisma schema file', {
      defaultValue: 'prisma/schema.prisma',
    });
    answers.srcRoot = await promptText('Root source directory (all output paths derived from this)', {
      defaultValue: 'src',
    });
    answers.apiPrefix = await promptText('API route prefix (e.g. "tg-api" → /tg-api/users)', {
      defaultValue: 'tg-api',
    });
    answers.requireAdmin = await promptUser('Require admin role for all endpoints? (y/n): ', {
      defaultValue: true,
    });
    answers.enableDashboard = await promptUser('Enable React Admin dashboard generation? (y/n): ', {
      defaultValue: true,
    });

    return answers;
  }

  private buildConfigTemplate(values?: Record<string, any>): string {
    const schemaPath = values?.schemaPath ?? 'prisma/schema.prisma';
    const srcRoot = values?.srcRoot ?? 'src';
    const apiPrefix = values?.apiPrefix ?? 'tg-api';
    const requireAdmin = values?.requireAdmin ?? true;
    const enableDashboard = values?.enableDashboard ?? true;
    const dashboardSection = enableDashboard
      ? `  dashboard: {\n    root: '${srcRoot}/dashboard/src',\n  },`
      : `  dashboard: false,`;

    return `import type { UserConfig } from '@tgraph/backend-generator';

export const config: UserConfig = {
  // Path to your Prisma schema file
  schemaPath: '${schemaPath}',

  // Root source directory — all output paths are inferred from this
  srcRoot: '${srcRoot}',

  // API route prefix (e.g. /tg-api/users)
  apiPrefix: '${apiPrefix}',

  // Suffix for generated class names (e.g. 'Admin' → UserAdminService). Leave empty for none.
  apiSuffix: '',

  // Require admin role for all generated endpoints
  requireAdmin: ${requireAdmin},

  // Add authentication guards to all controllers
  authenticationEnabled: true,

  // Guards applied to generated controllers (when authenticationEnabled is true)
  guards: [
    { name: 'JwtAuthGuard', importPath: '@/guards/jwt-auth.guard' },
  ],

  // Additional guards for admin-only access (when requireAdmin is true)
  adminGuards: [],

  // Dashboard: set to false to disable, or { root: '...' } to enable
${dashboardSection}

  // Auto-confirm all prompts (useful for CI/CD)
  nonInteractive: false,
};
`;
  }

  public async generate(options?: ConfigFileGeneratorInput): Promise<string> {
    try {
      const runWizard = await promptUser('Run interactive init wizard? (y/n): ', { defaultValue: true });
      const answers = runWizard ? await this.ask() : undefined;

      const finalAnswers = { ...answers };
      if (options?.requireAdmin !== undefined) {
        finalAnswers.requireAdmin = options.requireAdmin;
      }

      return this.buildConfigTemplate(Object.keys(finalAnswers).length > 0 ? finalAnswers : undefined);
    } catch (error) {
      console.error(`❌ Error creating configuration file:`, error);
      throw new Error(`Error creating configuration file: ${error}`);
    }
  }
}
