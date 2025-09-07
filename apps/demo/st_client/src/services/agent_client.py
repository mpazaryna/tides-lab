"""
Tides Agent API Client
Handles all communication with the Tides agent services
"""
from typing import Dict, Any, Optional
from datetime import datetime
import requests

from ..config import ENVIRONMENTS, API_KEYS, TIDES_IDS


class AgentClient:
    """Client for interacting with Tides Agent services"""
    
    def __init__(self, environment: str, timeout: int = 30):
        """
        Initialize the agent client
        
        Args:
            environment: Environment key (e.g., "103 - Development")
            timeout: Request timeout in seconds
        """
        self.environment = environment
        self.timeout = timeout
        # Hardcode agent URL
        self.base_url = "https://tides-agent-102.mpazbot.workers.dev"
        # API key will be set dynamically per request
        self.api_key = None
        self.tides_id = "daily-tide-default"
    
    def call_service(self, service: str, api_key: str = None, tide_id: str = None, **kwargs) -> Dict[str, Any]:
        """
        Call a specific agent service
        
        Args:
            service: Service name (insights, optimize, questions, etc.)
            api_key: API key for authentication (required)
            tide_id: Tide ID to use for the service (optional, uses default if not provided)
            **kwargs: Service-specific parameters
            
        Returns:
            API response as dictionary
        """
        if not api_key:
            return {
                "error": "API key required",
                "details": "Please provide an API key for authentication"
            }
            
        # Use provided tide_id or fall back to default
        actual_tide_id = tide_id or self.tides_id
            
        try:
            payload = self._build_payload(service, api_key, actual_tide_id, **kwargs)
            endpoint = self._get_endpoint(service)
            
            response = requests.post(
                f"{self.base_url}{endpoint}",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "error": f"HTTP {response.status_code}",
                    "details": response.text
                }
        except Exception as e:
            return {
                "error": "Request failed",
                "details": str(e)
            }
    
    def chat(self, message: str, api_key: str = None, user_id: Optional[str] = None, tide_id: str = None) -> str:
        """
        Simple chat interface that returns response text
        
        Args:
            message: Message to send
            api_key: API key for authentication (required)
            user_id: Optional user ID
            tide_id: Tide ID to use for the chat (optional, uses default if not provided)
            
        Returns:
            Response text or error message
        """
        if not api_key:
            return "❌ API key required for chat"
            
        # Use provided tide_id or fall back to default
        actual_tide_id = tide_id or self.tides_id
            
        try:
            payload = {
                "message": message,
                "userId": user_id or "demo_user",
                "api_key": api_key,
                "tides_id": actual_tide_id,
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(
                f"{self.base_url}/chat",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                # Extract response text from various possible fields
                if isinstance(result, dict):
                    # Handle chat service response structure: { success: true, data: { message: "...", ... } }
                    if "data" in result and isinstance(result["data"], dict):
                        data = result["data"]
                        # First check for chat service message field
                        if "message" in data:
                            return data["message"]
                        # Handle other service response formats
                        elif "response" in data:
                            return data["response"]
                        elif "answer" in data:
                            return data["answer"]
                    
                    # Handle direct response fields (for backward compatibility)
                    for field in ["response", "message", "text", "content"]:
                        if field in result:
                            return result[field]
                    
                    # If it's a success response but no clear message, show raw data
                    if result.get("success") and "data" in result:
                        return f"🤖 Got response but couldn't extract message: {str(result['data'])[:500]}..."
                    
                    return f"🤖 Unexpected response format: {str(result)[:200]}..."
                return str(result)
            else:
                return f"❌ Agent error ({response.status_code}): {response.text[:200]}"
                
        except Exception as e:
            return f"❌ Connection failed: {str(e)}"
    
    def test_connection(self, api_key: str = None) -> str:
        """Test connection to the agent"""
        if not api_key:
            return "❌ API key required for connection test"
        return self.chat("ping", api_key)
    
    def _build_payload(self, service: str, api_key: str, tide_id: str, **kwargs) -> Dict[str, Any]:
        """Build request payload based on service type"""
        base_payload = {
            "api_key": api_key,
            "tides_id": tide_id
        }
        
        if service == "r2-test":
            if "r2_path" not in kwargs:
                raise ValueError("r2_path is required for r2-test service")
            return {"r2_test_path": kwargs["r2_path"]}
        
        elif service == "insights":
            payload = {**base_payload, "service": "insights"}
            if "timeframe" in kwargs:
                payload["timeframe"] = kwargs["timeframe"]
            return payload
        
        elif service == "optimize":
            payload = {**base_payload, "service": "optimize"}
            if "timeframe" in kwargs:
                payload["preferences"] = {"focus_time_blocks": 90}
            return payload
        
        elif service == "questions":
            return {
                **base_payload,
                "service": "questions",
                "question": kwargs.get("question", "How can I improve my productivity?")
            }
        
        elif service == "preferences":
            return {**base_payload, "service": "preferences"}
        
        elif service == "reports":
            payload = {**base_payload, "service": "reports", "report_type": "summary"}
            if "timeframe" in kwargs:
                payload["period"] = kwargs["timeframe"]
            return payload
        
        elif service == "chat":
            return {
                **base_payload,
                "service": "chat", 
                "message": kwargs.get("message", "How productive was I today?")
            }
        
        else:
            raise ValueError(f"Unknown service: {service}")
    
    def _get_endpoint(self, service: str) -> str:
        """Get the endpoint path for a service"""
        if service == "chat":
            return "/chat"
        else:
            return "/coordinator"