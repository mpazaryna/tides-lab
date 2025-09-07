"""
MCP Client for Tides
Real MCP server interaction via JSON-RPC 2.0
"""
from typing import Dict, Any, List
import json
import requests

from ..config import ENVIRONMENTS, API_KEYS


class MCPClient:
    """Client for interacting with MCP servers"""
    
    def __init__(self, environment: str):
        """
        Initialize MCP client
        
        Args:
            environment: Environment key (e.g., "103 - Development")
        """
        self.environment = environment
        # Hardcode MCP server URL
        self.base_url = "https://tides-006.mpazbot.workers.dev/mcp"
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """List available MCP tools"""
        # Placeholder - return the 8 Tides tools
        return [
            {"name": "tide_create", "description": "Create a new tide"},
            {"name": "tide_list", "description": "List available tides"},
            {"name": "tide_flow", "description": "Manage flow states"},
            {"name": "tide_add_energy", "description": "Add energy data"},
            {"name": "tide_link_task", "description": "Link tasks to tides"},
            {"name": "tide_list_task_links", "description": "List task links"},
            {"name": "tide_get_report", "description": "Generate tide reports"},
            {"name": "tides_get_participants", "description": "Get tide participants"}
        ]
    
    def execute_tool(self, tool_name: str, parameters: Dict[str, Any] = None, api_key: str = None) -> Dict[str, Any]:
        """
        Execute an MCP tool via JSON-RPC 2.0
        
        Args:
            tool_name: Name of the tool to execute
            parameters: Tool parameters
            api_key: API key for authentication (required)
            
        Returns:
            Tool execution result
        """
        if not api_key:
            return {
                "status": "error",
                "error": "API key required for MCP tool execution",
                "tool": tool_name
            }
            
        if parameters is None:
            parameters = {}
            
        try:
            # Build JSON-RPC 2.0 request
            jsonrpc_request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": parameters
                }
            }
            
            # Make request to MCP server with Bearer token authentication
            response = requests.post(
                self.base_url,
                json=jsonrpc_request,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream",
                    "Authorization": f"Bearer {api_key}"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                # Check if response is event stream or JSON
                content_type = response.headers.get('content-type', '')
                
                if 'text/event-stream' in content_type:
                    # Handle event stream response
                    events = []
                    for line in response.text.strip().split('\n'):
                        if line.startswith('data: '):
                            try:
                                event_data = json.loads(line[6:])
                                events.append(event_data)
                            except json.JSONDecodeError:
                                pass
                    
                    # Return the last event or all events
                    if events:
                        # Check if last event has the result
                        last_event = events[-1]
                        if "result" in last_event:
                            return {
                                "status": "success",
                                "result": last_event["result"],
                                "tool": tool_name
                            }
                        elif "error" in last_event:
                            return {
                                "status": "error",
                                "error": last_event["error"],
                                "tool": tool_name
                            }
                    
                    return {
                        "status": "error",
                        "error": "No valid events in stream",
                        "tool": tool_name,
                        "raw_response": response.text[:500]
                    }
                else:
                    # Handle JSON response
                    try:
                        result = response.json()
                        if "error" in result:
                            return {
                                "status": "error",
                                "error": result["error"],
                                "tool": tool_name
                            }
                        else:
                            return {
                                "status": "success",
                                "result": result.get("result"),
                                "tool": tool_name
                            }
                    except json.JSONDecodeError:
                        return {
                            "status": "error",
                            "error": f"Invalid JSON response: {response.text[:200]}",
                            "tool": tool_name
                        }
            else:
                return {
                    "status": "error", 
                    "error": f"HTTP {response.status_code}: {response.text}",
                    "tool": tool_name
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": f"Request failed: {str(e)}",
                "tool": tool_name
            }