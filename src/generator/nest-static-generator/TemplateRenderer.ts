/**
 * Template renderer for static file generation
 * Provides simple variable substitution using {{variableName}} syntax
 */
export class TemplateRenderer {
  /**
   * Render multiple templates with the same variables
   * @param templates Record of template name to template string
   * @param variables Object containing variable values
   * @returns Record of template name to rendered content
   */
  private renderAll(
    templates: Record<string, string>,
    variables: Record<string, string>,
  ): Record<string, string> {
    const results: Record<string, string> = {};
    
    for (const [name, template] of Object.entries(templates)) {
      results[name] = this.render(template, variables);
    }
    
    return results;
  }

  /**
   * Render a template with variable substitution
   * @param template Template string with {{variable}} placeholders
   * @param variables Object containing variable values
   * @returns Rendered template with variables replaced
   */
  render(template: string, variables: Record<string, string>): string {
    let result = template;
    
    // Replace all {{variableName}} with corresponding values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    
    // Check for any unreplaced variables and warn
    const unreplaced = result.match(/\{\{[^}]+\}\}/g);
    if (unreplaced) {
      console.warn(`⚠️  Warning: Template contains unreplaced variables: ${unreplaced.join(', ')}`);
    }
    
    return result;
  }
}

