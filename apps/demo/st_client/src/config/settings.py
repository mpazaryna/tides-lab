"""
Configuration settings for Tides environments and services
"""
from typing import Dict, Any

# Environment configuration - Single stable environment for testing
ENVIRONMENT_CONFIG = {
    "agent": "https://tides-agent-102.mpazbot.workers.dev",
    "mcp": "https://tides-006.mpazbot.workers.dev/mcp",
    "storage": "tides-006-storage",
    "description": "Stable testing environment"
}

# Default API key for testing
DEFAULT_API_KEY = "tides_55987798-3442-42a7-bd01-a24b07a071d5_ss651o"

# Default tide ID (can be overridden in UI)
DEFAULT_TIDE_ID = "daily-tide-default"

# Service definitions for API testing
SERVICE_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "insights": {
        "name": "Insights",
        "description": "Generate productivity insights and analytics",
        "params": ["timeframe"],
        "endpoint": "/coordinator"
    },
    "optimize": {
        "name": "Optimize", 
        "description": "Get personalized schedule recommendations",
        "params": ["timeframe"],
        "endpoint": "/coordinator"
    },
    "questions": {
        "name": "Questions",
        "description": "Ask specific productivity questions",
        "params": ["question"],
        "endpoint": "/coordinator"
    },
    "reports": {
        "name": "Reports",
        "description": "Create detailed productivity reports",
        "params": ["timeframe"],
        "endpoint": "/coordinator"
    },
    "chat": {
        "name": "Chat",
        "description": "AI-powered conversation interface",
        "params": ["message"],
        "endpoint": "/chat"
    }
}