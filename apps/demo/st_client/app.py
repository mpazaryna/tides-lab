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
    render_monitoring_tab
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
    
    # Show workflow header
    st.header("Tides Workflow")
    st.markdown("""
    **Testing Flow:**
    1. **Get Tide IDs** → Use MCP Tools tab to run `tide_list` and copy a tide_id
    2. **Test Agent Services** → Use API Tests tab with the tide_id to test insights, questions, etc.
    3. **Chat with Agent** → Use Agent Chat tab for conversational testing
    """)
    st.markdown("---")
    
    # Main content area with tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "🔧 MCP Tools (Get Tide IDs)", 
        "🧪 API Tests (Use Tide ID)", 
        "💬 Agent Chat",
        "📊 Monitoring"
    ])
    
    with tab1:
        render_mcp_tools_tab("102 - Staging", api_key)
    
    with tab2:
        render_api_tests_tab(agent_client, api_key)
    
    with tab3:
        render_chat_tab(agent_client, api_key)
    
    with tab4:
        render_monitoring_tab()


if __name__ == "__main__":
    main()