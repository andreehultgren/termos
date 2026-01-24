/**
 * Parses a command template string and extracts variable names.
 * Variables are defined using double curly braces: {{variable_name}}
 *
 * @param template - The command template string
 * @returns Array of unique variable names found in the template
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match: RegExpExecArray | null = regex.exec(template);

  while (match !== null) {
    const varName = match[1].trim();
    if (varName && !variables.includes(varName)) {
      variables.push(varName);
    }

    match = regex.exec(template);
  }

  return variables;
}

/**
 * Replaces template variables with their corresponding values.
 *
 * @param template - The command template string
 * @param values - Object mapping variable names to their values
 * @returns The command string with all variables replaced
 */
export function replaceTemplateVariables(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
    const trimmedName = varName.trim();
    return values[trimmedName] ?? "";
  });
}
