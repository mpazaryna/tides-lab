"""
Tides Agent API Client
Handles all communication with the Tides agent services
"""
from typing import Dict, Any, Optional
from datetime import datetime
import requests

from ..config import ENVIRONMENT_CONFIG, DEFAULT_API_KEY, DEFAULT_TIDE_ID


class AgentClient:
    """Client for interacting with Tides Agent services"""
    
    def __init__(self, environment: str = "Stable Testing", timeout: int = 30):
        """
        Initialize the agent client with stable environment configuration
        
        Args:
            environment: Environment description (for display purposes)
            timeout: Request timeout in seconds
        """
        self.environment = environment
        self.timeout = timeout
        # Use environment config for agent URL
        self.base_url = ENVIRONMENT_CONFIG["agent"]
        # API key will be set dynamically per request
        self.api_key = None
        self.tides_id = DEFAULT_TIDE_ID
    
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
        Uses the coordinator endpoint with AI inference (not direct /chat)
        
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
                # No explicit service - let AI inference determine the right service
            }
            
            # Use coordinator endpoint for AI-powered routing
            response = requests.post(
                f"{self.base_url}/coordinator",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                # Extract response text from various possible fields
                if isinstance(result, dict):
                    # Handle agent service response structure: { success: true, data: { ... }, metadata: { service: "..." } }
                    if "data" in result and isinstance(result["data"], dict):
                        data = result["data"]
                        service = result.get("metadata", {}).get("service", "unknown")
                        
                        # Handle different service response formats
                        if service == "insights" and "productivity_score" in data:
                            return self._format_insights_response(data)
                        elif service == "optimize" and "recommendations" in data:
                            return self._format_optimize_response(data)
                        elif service == "reports" and "summary" in data:
                            return self._format_reports_response(data)
                        elif "message" in data:
                            return data["message"]
                        elif "response" in data:
                            return data["response"]
                        elif "answer" in data:
                            return data["answer"]
                        else:
                            # Format structured data nicely
                            return self._format_structured_response(data, service)
                    
                    # Handle direct response fields (for backward compatibility)
                    for field in ["response", "message", "text", "content"]:
                        if field in result:
                            return result[field]
                    
                    # If it's a success response but no clear message, show formatted data
                    if result.get("success") and "data" in result:
                        return self._format_structured_response(result["data"], "unknown")
                    
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
    
    def _format_insights_response(self, data: dict) -> str:
        """Format insights service response for better readability"""
        response = f"📊 **Productivity Insights**\n\n"
        response += f"**Overall Score:** {data.get('productivity_score', 'N/A')}/100\n\n"
        
        if "trends" in data:
            trends = data["trends"]
            response += f"**Daily Average:** {trends.get('daily_average', 'N/A')}\n"
            if "improvement_areas" in trends:
                response += f"**Areas for Improvement:**\n"
                for area in trends["improvement_areas"]:
                    response += f"• {area}\n"
                response += "\n"
        
        if "recommendations" in data:
            response += f"**Recommendations:**\n"
            for i, rec in enumerate(data["recommendations"], 1):
                response += f"{i}. {rec}\n"
        
        return response
    
    def _format_optimize_response(self, data: dict) -> str:
        """Format optimize service response for better readability"""
        response = f"⚡ **Schedule Optimization**\n\n"
        
        if "recommendations" in data:
            response += f"**Recommendations:**\n"
            for i, rec in enumerate(data["recommendations"], 1):
                response += f"{i}. {rec}\n"
        
        return response
    
    def _format_reports_response(self, data: dict) -> str:
        """Format reports service response for better readability"""
        response = f"📋 **Report Summary**\n\n"
        response += data.get("summary", "No summary available")
        return response
    
    def _format_structured_response(self, data: dict, service: str) -> str:
        """Format any structured response in a readable way"""
        response = f"🤖 **{service.title()} Service Response**\n\n"
        
        # Handle common fields
        if "productivity_score" in data:
            response += f"**Productivity Score:** {data['productivity_score']}/100\n"
        
        if "recommendations" in data:
            response += f"**Recommendations:**\n"
            recs = data["recommendations"][:5]  # Show first 5
            for i, rec in enumerate(recs, 1):
                response += f"{i}. {rec}\n"
            if len(data["recommendations"]) > 5:
                response += f"... and {len(data['recommendations']) - 5} more\n"
        
        if "message" in data:
            response += f"\n**Message:** {data['message']}\n"
        
        if "answer" in data:
            response += f"\n**Answer:** {data['answer']}\n"
            
        return response

    def _get_endpoint(self, service: str) -> str:
        """Get the endpoint path for a service
        
        ALL services now use /coordinator for AI-powered routing
        The legacy direct endpoints are deprecated
        """
        # Always use coordinator for AI inference
        return "/coordinator"