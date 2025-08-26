/**
 * @fileoverview Demo and Testing Service for Direct Tool Access Integration
 * 
 * This service demonstrates the new direct tool access functionality and provides
 * testing utilities to verify the integration is working correctly.
 * 
 * @author Tides Mobile Development Team
 * @version 1.0.0
 * @since 2025-08-15
 */

import { LoggingService } from './LoggingService';
import { toolRegistryService } from './ToolRegistryService';

export class DirectAccessDemo {
  private static readonly SERVICE_NAME = "DirectAccessDemo";

  /**
   * Run a complete demo of the direct access functionality
   */
  static async runDemo(): Promise<void> {
    LoggingService.info(
      DirectAccessDemo.SERVICE_NAME,
      "Starting Direct Access Demo",
      {}
    );

    try {
      // 1. Show available tools
      const tools = toolRegistryService.getToolNames();
      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Available tools discovered",
        { toolCount: tools.length, tools }
      );

      // 2. Show tools by category
      const toolsByCategory = toolRegistryService.getToolsByCategory();
      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Tools organized by category",
        { categories: Object.keys(toolsByCategory) }
      );

      // 3. Test tool metadata access
      const createTideMeta = toolRegistryService.getToolMetadata('createTide');
      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Tool metadata example",
        { 
          tool: 'createTide',
          displayName: createTideMeta?.displayName,
          description: createTideMeta?.description,
          parameterCount: createTideMeta?.parameters.length
        }
      );

      // 4. Test partial name matching
      const partialMatch = toolRegistryService.findToolByPartialName('create');
      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Partial name matching test",
        { input: 'create', match: partialMatch }
      );

      // 5. Test parameter validation
      const validationTest = toolRegistryService.validateToolParams('createTide', {
        name: 'Demo Tide',
        flowType: 'daily'
      });
      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Parameter validation test",
        { success: validationTest.success }
      );

      // 6. Get registry statistics
      const stats = toolRegistryService.getRegistryStats();
      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Registry statistics",
        stats
      );

      LoggingService.info(
        DirectAccessDemo.SERVICE_NAME,
        "Direct Access Demo completed successfully",
        {}
      );

    } catch (error) {
      LoggingService.error(
        DirectAccessDemo.SERVICE_NAME,
        "Demo failed",
        { error }
      );
    }
  }

  /**
   * Test dynamic tool menu generation data
   */
  static getDynamicMenuData(): Record<string, any> {
    const toolsByCategory = toolRegistryService.getToolsByCategory();
    const menuData: Record<string, any> = {};

    for (const [category, tools] of Object.entries(toolsByCategory)) {
      menuData[category] = tools.map(tool => ({
        name: tool.name,
        displayName: tool.displayName,
        icon: tool.icon,
        mcpToolName: tool.mcpToolName,
        parameterCount: tool.parameters.length
      }));
    }

    return menuData;
  }

  /**
   * Test enhanced slash command parsing
   */
  static testSlashCommandParsing(command: string): any {
    // Simulate the enhanced parsing logic
    const [, partialToolName, ...paramParts] = command.split(" ");
    
    const exactToolName = toolRegistryService.findToolByPartialName(partialToolName);
    
    const parameters: Record<string, any> = {};
    paramParts.forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        try {
          parameters[key] = JSON.parse(value);
        } catch {
          parameters[key] = value;
        }
      }
    });

    const validation = exactToolName 
      ? toolRegistryService.validateToolParams(exactToolName, parameters)
      : { success: false, error: `Tool '${partialToolName}' not found` };

    return {
      originalCommand: command,
      partialToolName,
      exactToolName,
      parameters,
      validation,
      success: validation.success
    };
  }
}

// Export for use in components
export const directAccessDemo = DirectAccessDemo;