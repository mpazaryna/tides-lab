/**
 * HelloAgent - Test/Demo Agent for Tides System
 * 
 * This module exports the HelloAgent Durable Object class, which serves as a
 * reference implementation for the Tides autonomous agent system.
 * 
 * ## Usage
 * 
 * Import and use in your main worker:
 * ```typescript
 * import { HelloAgent } from '../agents/hello';
 * 
 * // Export for Durable Object binding
 * export { HelloAgent };
 * 
 * // Route requests to agent
 * const agentId = env.HELLO_AGENT.idFromName('user-123');
 * const agent = env.HELLO_AGENT.get(agentId);
 * return agent.fetch(request);
 * ```
 * 
 * ## Agent Features
 * 
 * - **REST API**: Complete HTTP endpoint implementation
 * - **WebSocket Support**: Real-time bidirectional communication
 * - **State Persistence**: Durable Object storage integration
 * - **Multi-client Broadcasting**: Real-time message distribution
 * - **Comprehensive Testing**: Unit, integration, and E2E test coverage
 * 
 * ## Endpoints
 * 
 * - `GET/POST /hello` - Greeting functionality
 * - `GET /visits` - Visit counter with persistence
 * - `POST /message` - Message storage with WebSocket broadcast
 * - `GET /messages` - Message retrieval
 * - `GET /stats` - Agent health and statistics
 * - `POST /reset` - State reset functionality
 * - WebSocket at `/ws` - Real-time communication
 * 
 * @see {@link HelloAgent} for detailed API documentation
 */
export { HelloAgent } from './agent';