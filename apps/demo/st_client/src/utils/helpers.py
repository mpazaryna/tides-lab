"""
Utility functions for the Streamlit app
"""
import streamlit as st
from typing import Optional

from ..config import ENVIRONMENT_CONFIG, DEFAULT_API_KEY
from ..services import AgentClient


def initialize_session_state():
    """Initialize session state variables"""
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    if 'environment' not in st.session_state:
        st.session_state.environment = "Stable Testing"
    if 'api_key' not in st.session_state:
        st.session_state.api_key = DEFAULT_API_KEY
    if 'user_id' not in st.session_state:
        st.session_state.user_id = "demo_user"
    if 'auth_token' not in st.session_state:
        st.session_state.auth_token = None


def render_sidebar() -> tuple[AgentClient, str]:
    """
    Render the sidebar with hardcoded configuration status
    
    Returns:
        Tuple of (Configured AgentClient instance, API key)
    """
    # Use hardcoded values
    environment = "102 - Staging"
    api_key = st.session_state.api_key
    
    with st.sidebar:
        st.title("🌊 Tides Client")
        st.markdown("---")
        
        # Configuration Status (read-only)
        st.subheader("📊 Configuration")
        st.success("**Agent Server:** `tides-agent-102.mpazbot.workers.dev`")
        st.success("**MCP Server:** `tides-006.mpazbot.workers.dev/mcp`")
        st.info("**API Key:** `tides_55987798-...ss651o`")
        
        st.markdown("---")
        
        # Quick actions
        st.subheader("Quick Actions")
        if st.button("🔄 Clear Chat"):
            st.session_state.messages = []
            st.rerun()
        
        # Create agent client with hardcoded environment
        agent_client = AgentClient(environment)
        
        if st.button("🔍 Test Connection"):
            with st.spinner("Testing connection..."):
                result = agent_client.test_connection(api_key)
                if result.startswith("❌"):
                    st.error(result)
                else:
                    st.success("Connection successful!")
    
    return agent_client, api_key