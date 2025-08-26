/**
 * @fileoverview MCP Prompt Template Loader
 * 
 * This module provides utilities for loading and processing MCP prompt templates
 * from external markdown files. This approach allows for easy maintenance,
 * version control, and documentation of prompts without embedding large
 * template strings in the codebase.
 * 
 * @author Tides Development Team
 * @version 1.0.0
 * @since 2025-08-07
 */

// Note: This will need to be adapted for Cloudflare Workers environment
// For now, we'll inline the templates as a fallback
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Interface for prompt template metadata
 */
interface PromptMetadata {
  title: string;
  description: string;
  version: string;
  lastUpdated: string;
}

/**
 * Interface for parsed prompt template
 */
interface PromptTemplate {
  metadata: PromptMetadata;
  contextTemplate: string;
  schema: any;
}

/**
 * Cache for loaded prompt templates to avoid repeated file reads
 */
const templateCache = new Map<string, PromptTemplate>();

/**
 * Load and parse a prompt template from markdown file
 * 
 * @param promptName Name of the prompt (matches filename without extension)
 * @returns Parsed prompt template with metadata, context, and schema
 */
export async function loadPromptTemplate(promptName: string): Promise<PromptTemplate> {
  // Check cache first
  if (templateCache.has(promptName)) {
    return templateCache.get(promptName)!;
  }

  // Convert prompt name to filename
  const filename = promptName.replace(/_/g, '-') + '.md';
  const promptPath = path.join(__dirname, filename);

  try {
    const content = await fs.readFile(promptPath, 'utf-8');
    const template = parsePromptTemplate(content, promptName);
    
    // Cache the parsed template
    templateCache.set(promptName, template);
    
    return template;
  } catch (error) {
    throw new Error(`Failed to load prompt template '${promptName}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse markdown prompt template content
 * 
 * @param content Raw markdown content
 * @param promptName Name of the prompt for error reporting
 * @returns Parsed prompt template
 */
function parsePromptTemplate(content: string, promptName: string): PromptTemplate {
  try {
    // Extract context template (content between ```...```)
    const contextMatch = content.match(/## Context Template\s*\n\s*```\s*\n([\s\S]*?)\n```/);
    if (!contextMatch) {
      throw new Error(`No context template found in ${promptName}`);
    }
    const contextTemplate = contextMatch[1].trim();

    // Extract schema (TypeScript code block)
    const schemaMatch = content.match(/## Schema\s*\n\s*```typescript\s*\n([\s\S]*?)\n```/);
    if (!schemaMatch) {
      throw new Error(`No schema found in ${promptName}`);
    }
    
    // Parse schema from TypeScript interface to JSON-like structure
    const schemaText = schemaMatch[1].trim();
    const schema = parseSchemaFromTypeScript(schemaText);

    // Extract metadata
    const metadata = parseMetadata(content, promptName);

    return {
      metadata,
      contextTemplate,
      schema
    };
  } catch (error) {
    throw new Error(`Failed to parse prompt template '${promptName}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse metadata from markdown content
 * 
 * @param content Markdown content
 * @param promptName Prompt name for defaults
 * @returns Parsed metadata
 */
function parseMetadata(content: string, promptName: string): PromptMetadata {
  // Extract title from first heading
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : promptName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Extract description from comment in context template or use default
  const descMatch = content.match(/- \*\*Description\*\*: (.+)$/m);
  const description = descMatch ? descMatch[1] : `Analysis prompt for ${title.toLowerCase()}`;

  // Extract version and last updated from metadata section
  const versionMatch = content.match(/- \*\*Version\*\*: (.+)$/m);
  const version = versionMatch ? versionMatch[1] : '1.0.0';

  const updatedMatch = content.match(/- \*\*Last Updated\*\*: (.+)$/m);
  const lastUpdated = updatedMatch ? updatedMatch[1] : new Date().toISOString().split('T')[0];

  return {
    title,
    description,
    version,
    lastUpdated
  };
}

/**
 * Parse Zod schema from TypeScript interface syntax
 * 
 * @param schemaText TypeScript interface text
 * @returns Zod schema object approximation
 */
function parseSchemaFromTypeScript(schemaText: string): any {
  const schema: any = {};
  
  // Remove outer braces and split by lines
  const cleanText = schemaText.replace(/^\{|\}$/g, '').trim();
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);

  for (const line of lines) {
    // Parse line format: property_name: type; // Optional: description
    const match = line.match(/^(\w+):\s*([^;]+);?\s*(?:\/\/\s*(.+))?$/);
    if (match) {
      const [, name, type, description] = match;
      
      // Convert TypeScript types to Zod-like schema info
      let schemaType = 'string';
      let optional = false;
      let enumValues = null;
      
      if (type.includes('|')) {
        // Handle union types like 'basic'|'detailed'|'comprehensive'
        enumValues = type.split('|').map(t => t.trim().replace(/'/g, '"'));
        schemaType = 'enum';
      } else if (type.includes('string[]')) {
        schemaType = 'array';
      } else if (type.includes('number')) {
        schemaType = 'number';  
      } else if (type.includes('boolean')) {
        schemaType = 'boolean';
      }
      
      if (description && (description.includes('Optional:') || name.endsWith('?'))) {
        optional = true;
      }

      schema[name.replace('?', '')] = {
        type: schemaType,
        optional,
        description: description?.replace(/^(Required:|Optional:)\s*/, '') || `${name} parameter`,
        ...(enumValues && { enum: enumValues })
      };
    }
  }

  return schema;
}

/**
 * Process prompt template with data substitution
 * 
 * @param template Context template string
 * @param data Data object for template variable substitution
 * @returns Processed template with variables substituted
 */
export function processTemplate(template: string, data: any): string {
  try {
    // Simple template substitution using {{variable}} syntax
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        // Evaluate expression in the context of the data object
        // Note: This is a simplified implementation. In production, consider using a proper template engine.
        const func = new Function('data', `with(data) { return ${expression}; }`);
        const result = func(data);
        return result !== undefined ? String(result) : match;
      } catch (error) {
        console.warn(`Template variable evaluation failed for: ${expression}`, error);
        return match; // Return original if evaluation fails
      }
    });
  } catch (error) {
    console.error('Template processing failed:', error);
    return template; // Return original template if processing fails
  }
}

/**
 * Get all available prompt template names
 * 
 * @returns Array of available prompt names
 */
export async function getAvailablePrompts(): Promise<string[]> {
  try {
    const files = await fs.readdir(__dirname);
    return files
      .filter(file => file.endsWith('.md') && file !== 'README.md')
      .map(file => file.replace('.md', '').replace(/-/g, '_'));
  } catch (error) {
    console.error('Failed to list available prompts:', error);
    return [];
  }
}

/**
 * Clear the template cache (useful for development/testing)
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}