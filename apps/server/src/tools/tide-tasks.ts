/**
 * @fileoverview External Task Integration Tools
 * 
 * This module provides tools for linking external tasks and work items to tides,
 * creating a unified view of work across different platforms and systems. These
 * tools enable users to connect their tidal workflows with their existing task
 * management and development tools.
 * 
 * ## Core Concepts
 * 
 * ### Task Linking
 * Task links connect external work items to tides for context and tracking:
 * - **GitHub Issues/PRs**: Link development work to project tides
 * - **Linear/Jira Tasks**: Connect product work to weekly/project tides
 * - **Obsidian Notes**: Link knowledge work to seasonal/research tides
 * - **Calendar Events**: Connect meetings to daily tides
 * - **General URLs**: Link any web resource to relevant tides
 * 
 * ### Integration Patterns
 * ```
 * External Task → Task Link → Tide → Flow Sessions
 * ```
 * 
 * This creates a hierarchy where external work items are grouped under tides,
 * and each tide can have multiple flow sessions for focused work on those tasks.
 * 
 * ## Use Cases
 * 
 * ### Development Workflow Integration
 * ```typescript
 * // Link GitHub issue to project tide
 * await linkTideTask({
 *   tide_id: "tide_auth_refactor",
 *   task_url: "https://github.com/user/repo/issues/42",
 *   task_title: "Implement OAuth2 integration",
 *   task_type: "github_issue"
 * }, storage);
 * 
 * // Start flow session for that work
 * await startTideFlow({
 *   tide_id: "tide_auth_refactor",
 *   work_context: "Working on GitHub issue #42 - OAuth2"
 * }, storage);
 * ```
 * 
 * ### Project Management Integration
 * ```typescript
 * // Link multiple tasks to weekly sprint tide
 * const sprintTasks = [
 *   { url: "https://linear.app/team/issue/123", title: "User onboarding flow" },
 *   { url: "https://linear.app/team/issue/124", title: "Dashboard performance" },
 *   { url: "https://linear.app/team/issue/125", title: "Mobile responsiveness" }
 * ];
 * 
 * for (const task of sprintTasks) {
 *   await linkTideTask({
 *     tide_id: weeklySprintTideId,
 *     task_url: task.url,
 *     task_title: task.title,
 *     task_type: "linear_task"
 *   }, storage);
 * }
 * ```
 * 
 * ### Knowledge Work Integration
 * ```typescript
 * // Link research materials to seasonal planning tide
 * await linkTideTask({
 *   tide_id: "tide_q1_planning",
 *   task_url: "obsidian://vault/Research/Market Analysis 2025",
 *   task_title: "Q1 Market Analysis Research",
 *   task_type: "obsidian_note"
 * }, storage);
 * ```
 * 
 * ## Data Models
 * 
 * ### TaskLink
 * ```typescript
 * interface TaskLink {
 *   id: string;                   // Format: "link_TIMESTAMP_HASH"
 *   tide_id: string;             // Parent tide ID
 *   task_url: string;            // URL to external task
 *   task_title: string;          // Display title for the task
 *   task_type: string;           // System type (github_issue, linear_task, etc.)
 *   linked_at: string;           // ISO timestamp when linked
 *   status?: string;             // Optional task status from external system
 *   metadata?: object;           // Optional additional data from external system
 * }
 * ```
 * 
 * ### Supported Task Types
 * - **github_issue**: GitHub issues and pull requests
 * - **github_pr**: GitHub pull requests (specific type)
 * - **linear_task**: Linear tasks and issues
 * - **jira_task**: Jira tickets and issues
 * - **obsidian_note**: Obsidian vault notes and documents
 * - **notion_page**: Notion pages and databases
 * - **calendar_event**: Calendar events and meetings
 * - **general**: Generic URL or unspecified external resource
 * 
 * ## Mobile/Web App Integration
 * 
 * ### Deep Linking Support
 * Task links are designed to work with mobile deep linking:
 * ```typescript
 * // When user taps a task link in the app
 * const taskUrl = taskLink.task_url;
 * if (taskUrl.startsWith('github://')) {
 *   openGitHubApp(taskUrl);
 * } else if (taskUrl.startsWith('linear://')) {
 *   openLinearApp(taskUrl);
 * } else {
 *   openWebBrowser(taskUrl);
 * }
 * ```
 * 
 * ### Task Context in Flow Sessions
 * When starting flow sessions, task context can be automatically populated:
 * ```typescript
 * const taskLinks = await listTideTaskLinks({ tide_id }, storage);
 * const workContext = `Working on: ${taskLinks.links.map(l => l.task_title).join(', ')}`;
 * 
 * await startTideFlow({
 *   tide_id,
 *   work_context: workContext
 * }, storage);
 * ```
 * 
 * ## Future Extensions
 * 
 * Planned additions to this module:
 * - `unlinkTideTask()` - Remove task links
 * - `updateTaskStatus()` - Sync external task status
 * - `importTasksFromGitHub()` - Bulk import from GitHub repositories
 * - `importTasksFromLinear()` - Bulk import from Linear teams
 * - `syncTaskStatus()` - Two-way status synchronization
 * - `getTaskMetadata()` - Fetch additional task details from external APIs
 * 
 * @author Tides Development Team
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { TideStorage } from '../storage';

/**
 * Links an external task to a tide
 * 
 * @description Creates a connection between a tide and an external task from systems
 * like GitHub, Linear, Jira, Obsidian, etc. This enables unified workflow tracking
 * across all your tools and provides context for flow sessions.
 * 
 * @param {Object} params - The task linking parameters
 * @param {string} params.tide_id - The ID of the tide to link the task to
 * @param {string} params.task_url - The URL of the external task
 * @param {string} params.task_title - The title/name of the task
 * @param {string} [params.task_type='general'] - The type of task system
 * @param {TideStorage} storage - Storage instance for persistence
 * 
 * @returns {Promise<LinkTaskResponse>} Promise resolving to link details
 * 
 * @example
 * // React Native - link GitHub issue
 * const result = await linkTideTask({
 *   tide_id: "tide_1738366800000_abc123",
 *   task_url: "https://github.com/user/repo/issues/42",
 *   task_title: "Implement OAuth2 integration", 
 *   task_type: "github_issue"
 * }, storage);
 * 
 * @since 2.0.0
 */
export async function linkTideTask(
  params: {
    tide_id: string;
    task_url: string;
    task_title: string;
    task_type?: string;
  },
  storage: TideStorage
) {
  try {
    const task_type = params.task_type || "general";
    const linked_at = new Date().toISOString();
    
    const taskLink = await storage.addTaskLink(params.tide_id, {
      task_url: params.task_url,
      task_title: params.task_title,
      task_type,
      linked_at,
    });
    
    return {
      success: true,
      link_id: taskLink.id,
      tide_id: params.tide_id,
      task_url: params.task_url,
      task_title: params.task_title,
      task_type,
      linked_at,
      message: `Task '${params.task_title}' linked successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Lists all task links for a tide
 * 
 * @description Retrieves all external tasks linked to a specific tide, formatted
 * for display in task lists, cards, or navigation menus. Perfect for showing
 * context about what external work is associated with a tide.
 * 
 * @param {Object} params - The listing parameters
 * @param {string} params.tide_id - The ID of the tide to get task links for
 * @param {TideStorage} storage - Storage instance for data retrieval
 * 
 * @returns {Promise<ListTaskLinksResponse>} Promise resolving to task links list
 * 
 * @example
 * // React Native - display linked tasks in tide detail
 * const result = await listTideTaskLinks({
 *   tide_id: "tide_1738366800000_abc123"
 * }, storage);
 * 
 * if (result.success) {
 *   // Perfect for FlatList of linked tasks
 *   const taskLinks = result.links;
 * }
 * 
 * @since 2.0.0
 */
export async function listTideTaskLinks(
  params: {
    tide_id: string;
  },
  storage: TideStorage
) {
  try {
    const taskLinks = await storage.getTaskLinks(params.tide_id);
    
    const formattedLinks = taskLinks.map(link => ({
      id: link.id,
      task_url: link.task_url,
      task_title: link.task_title,
      task_type: link.task_type,
      linked_at: link.linked_at,
    }));
    
    return {
      success: true,
      tide_id: params.tide_id,
      links: formattedLinks,
      count: formattedLinks.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      tide_id: params.tide_id,
      links: [],
      count: 0,
    };
  }
}