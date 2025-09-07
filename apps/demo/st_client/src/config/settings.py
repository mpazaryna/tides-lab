"""
Configuration settings for Tides environments and services
"""
from typing import Dict, Any

# Environment configurations
ENVIRONMENTS: Dict[str, Dict[str, Any]] = {
    "006 - MCP Server": {
        "agent": "https://tides-agent-103.mpazbot.workers.dev",
        "mcp": "https://tides-006.mpazbot.workers.dev/mcp",
        "storage": "tides-006-storage",
        "description": "MCP Server environment"
    },
    "103 - Development": {
        "agent": "https://tides-agent-103.mpazbot.workers.dev",
        "mcp": "https://tides-003.mpazbot.workers.dev",
        "storage": "tides-003-storage",
        "description": "Development environment for testing"
    },
    "102 - Staging": {
        "agent": "https://tides-agent-102.mpazbot.workers.dev",
        "mcp": "https://tides-002.mpazbot.workers.dev",
        "storage": "tides-006-storage",
        "description": "Staging environment for pre-production"
    },
    "101 - Production": {
        "agent": "https://tides-agent-101.mpazbot.workers.dev",
        "mcp": "https://tides-001.mpazbot.workers.dev",
        "storage": "tides-001-storage",
        "description": "Production environment (iOS team)"
    }
}

# API Keys for different environments
API_KEYS: Dict[str, str] = {
    "103 - Development": "tides_testuser_001",
    "102 - Staging": "tides_19874fa5-4a50-4dc4-9fea-ab4abf272ce1_12345", 
    "101 - Production": "tides_production_user_12345"
}

# Tides IDs for different environments
TIDES_IDS: Dict[str, str] = {
    "103 - Development": "daily-tide-default",
    "102 - Staging": "tide_1756412347954_wgq624k2ocf",
    "101 - Production": "daily-tide-default"
}

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