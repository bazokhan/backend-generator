import type { AdapterDefinition, HttpMethod, PrismaModel } from '@tg-scripts/types';

/**
 * Validation error for adapter configuration
 */
export class AdapterValidationError extends Error {
  constructor(
    public adapterName: string,
    message: string,
  ) {
    super(`Adapter "${adapterName}": ${message}`);
    this.name = 'AdapterValidationError';
  }
}

/**
 * Validator for adapter configurations
 */
export class AdapterValidator {
  private static readonly VALID_HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  /**
   * Validate a single adapter definition
   *
   * @param adapter - Adapter definition to validate
   * @param model - Associated Prisma model (for field validation)
   * @throws AdapterValidationError if validation fails
   */
  public validate(adapter: AdapterDefinition, model?: PrismaModel): void {
    this.validateConfig(adapter);

    if (model) {
      this.validateSelectFields(adapter, model);
      this.validateIncludeFields(adapter, model);
      this.validateTargetService(adapter, model);
    }

    this.validateHandlerCode(adapter);
  }

  /**
   * Validate adapter configuration object
   */
  private validateConfig(adapter: AdapterDefinition): void {
    const { config, name } = adapter;

    // Validate required fields
    if (!config.method) {
      throw new AdapterValidationError(name, 'Missing required field: method');
    }

    if (!config.path) {
      throw new AdapterValidationError(name, 'Missing required field: path');
    }

    // Validate HTTP method
    if (!AdapterValidator.VALID_HTTP_METHODS.includes(config.method)) {
      throw new AdapterValidationError(
        name,
        `Invalid HTTP method "${config.method}". Must be one of: ${AdapterValidator.VALID_HTTP_METHODS.join(', ')}`,
      );
    }

    // Validate path format
    if (!config.path.startsWith('/')) {
      throw new AdapterValidationError(name, `Path must start with "/". Got: "${config.path}"`);
    }

    // Validate path doesn't contain invalid characters
    if (!/^\/[a-zA-Z0-9\-_/:]*$/.test(config.path)) {
      throw new AdapterValidationError(
        name,
        `Path contains invalid characters. Only alphanumeric, hyphens, underscores, slashes, and colons are allowed. Got: "${config.path}"`,
      );
    }

    // Validate auth format
    if (config.auth !== undefined && config.auth !== null) {
      this.validateAuthConfig(adapter);
    }

    // Validate select and include are not both specified
    if (config.select && config.include) {
      throw new AdapterValidationError(name, 'Cannot specify both "select" and "include". Choose one.');
    }
  }

  /**
   * Validate auth configuration
   */
  private validateAuthConfig(adapter: AdapterDefinition): void {
    const { config, name } = adapter;

    if (typeof config.auth === 'string') {
      if (config.auth.trim().length === 0) {
        throw new AdapterValidationError(name, 'Auth guard name cannot be empty');
      }
    } else if (Array.isArray(config.auth)) {
      if (config.auth.length === 0) {
        throw new AdapterValidationError(name, 'Auth guards array cannot be empty');
      }

      for (const guard of config.auth) {
        if (typeof guard !== 'string' || !guard.trim()) {
          throw new AdapterValidationError(name, 'All auth guards must be non-empty strings');
        }
      }
    } else if (config.auth !== null && config.auth !== undefined) {
      throw new AdapterValidationError(name, 'Auth must be a string, array of strings, or undefined');
    }
  }

  /**
   * Validate select fields exist in the model
   */
  private validateSelectFields(adapter: AdapterDefinition, model: PrismaModel): void {
    const { config, name } = adapter;

    if (!config.select || config.select.length === 0) {
      return;
    }

    const modelFields = new Set(model.fields.map((f) => f.name));

    for (const field of config.select) {
      if (!modelFields.has(field)) {
        throw new AdapterValidationError(
          name,
          `Select field "${field}" does not exist in model "${model.name}". Available fields: ${Array.from(modelFields).join(', ')}`,
        );
      }
    }
  }

  /**
   * Validate include fields exist as relations in the model
   */
  private validateIncludeFields(adapter: AdapterDefinition, model: PrismaModel): void {
    const { config, name } = adapter;

    if (!config.include || config.include.length === 0) {
      return;
    }

    const relationFields = new Set(model.fields.filter((f) => f.isRelation).map((f) => f.name));

    for (const field of config.include) {
      if (!relationFields.has(field)) {
        throw new AdapterValidationError(
          name,
          `Include field "${field}" is not a relation in model "${model.name}". Available relations: ${Array.from(relationFields).join(', ') || 'none'}`,
        );
      }
    }
  }

  /**
   * Validate target service format
   */
  private validateTargetService(adapter: AdapterDefinition, model: PrismaModel): void {
    const { config, name } = adapter;

    // Target is optional
    if (!config.target) {
      return;
    }

    // Target should be in format "ServiceName.methodName"
    const targetPattern = /^[A-Z][a-zA-Z0-9]*Service\.[a-zA-Z][a-zA-Z0-9]*$/;

    if (!targetPattern.test(config.target)) {
      throw new AdapterValidationError(
        name,
        `Target must be in format "ServiceName.methodName". Got: "${config.target}"`,
      );
    }

    // Extract service name and validate it matches the model
    const targetParts = config.target.split('.');
    if (targetParts.length < 2) {
      throw new AdapterValidationError(
        name,
        `Target must be in format "ServiceName.methodName". Got: "${config.target}"`,
      );
    }

    const [serviceName] = targetParts;
    const expectedServiceName = `${model.name}Service`;

    // Note: We're lenient here - service name doesn't have to match exactly
    // Users might want to call other services
    // Just log a warning if it doesn't match
    if (serviceName && !serviceName.includes(model.name)) {
      console.warn(
        `Warning: Adapter "${name}" targets service "${serviceName}" which doesn't match model "${model.name}". Expected something like "${expectedServiceName}"`,
      );
    }
  }

  /**
   * Validate handler code structure
   */
  private validateHandlerCode(adapter: AdapterDefinition): void {
    const { handlerCode, name } = adapter;

    if (!handlerCode || handlerCode.trim().length === 0) {
      throw new AdapterValidationError(name, 'Handler code is empty');
    }

    // Validate handler is an async function
    if (!handlerCode.trim().startsWith('async')) {
      throw new AdapterValidationError(name, 'Handler must be an async function');
    }

    // Validate handler has a context parameter
    if (!handlerCode.includes('(ctx)') && !handlerCode.includes('(context)')) {
      throw new AdapterValidationError(name, 'Handler must accept a context parameter (ctx or context)');
    }

    // Validate handler returns something (has return statement or implicit return)
    const hasReturn = handlerCode.includes('return') || handlerCode.includes('=>');

    if (!hasReturn) {
      throw new AdapterValidationError(name, 'Handler must return a value (either { args } or adapter.response())');
    }
  }

  /**
   * Validate multiple adapters at once
   *
   * @param adapters - Array of adapter definitions to validate
   * @param model - Associated Prisma model
   * @returns Array of validation errors (empty if all valid)
   */
  public validateAll(adapters: AdapterDefinition[], model?: PrismaModel): AdapterValidationError[] {
    const errors: AdapterValidationError[] = [];

    for (const adapter of adapters) {
      try {
        this.validate(adapter, model);
      } catch (error) {
        if (error instanceof AdapterValidationError) {
          errors.push(error);
        } else {
          errors.push(new AdapterValidationError(adapter.name, `Unexpected error: ${error}`));
        }
      }
    }

    // Validate no duplicate paths
    this.validateNoDuplicatePaths(adapters, errors);

    return errors;
  }

  /**
   * Ensure no two adapters have the same method + path combination
   */
  private validateNoDuplicatePaths(adapters: AdapterDefinition[], errors: AdapterValidationError[]): void {
    const seen = new Map<string, string>();

    for (const adapter of adapters) {
      const key = `${adapter.config.method}:${adapter.config.path}`;

      if (seen.has(key)) {
        errors.push(
          new AdapterValidationError(
            adapter.name,
            `Duplicate endpoint: ${adapter.config.method} ${adapter.config.path} (already defined in adapter "${seen.get(key)}")`,
          ),
        );
      } else {
        seen.set(key, adapter.name);
      }
    }
  }
}
