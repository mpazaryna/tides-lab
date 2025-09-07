"""
Tides Streamlit Client - iOS Team Testing Interface
End-to-end testing environment for Tides Agent and MCP Server integration
"""

import streamlit as st

from src.utils import initialize_session_state, render_sidebar
from src.components import (
    render_chat_tab,
    render_api_tests_tab, 
    render_mcp_tools_tab,
    render_monitoring_tab,
    render_help_tab
)

# Page config
st.set_page_config(
    page_title="Tides Client",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)


def main():
    """Main application entry point"""
    # Initialize session state
    initialize_session_state()
    
    # Render sidebar and get agent client + API key
    agent_client, api_key = render_sidebar()
    
    # Main content area with tabs (moved up)
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "🔧 MCP Tools", 
        "🧪 API Tests", 
        "💬 Agent Chat",
        "📊 Monitoring",
        "❓ Help"
    ])
    
    with tab1:
        render_mcp_tools_tab(api_key)
    
    with tab2:
        render_api_tests_tab(agent_client, api_key)
    
    with tab3:
        render_chat_tab(agent_client, api_key)
    
    with tab4:
        render_monitoring_tab()
    
    with tab5:
        render_help_tab()


if __name__ == "__main__":
    main()