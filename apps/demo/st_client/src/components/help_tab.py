"""
Help Tab Component
User guide and workflow instructions
"""
import streamlit as st


def render_help_tab():
    """Render the help and instructions tab"""
    st.header("Tides Testing Guide")
    
    # Main workflow
    st.subheader("🔄 Testing Workflow")
    st.markdown("""
    **Follow this sequence for comprehensive testing:**
    
    1. **Get Tide IDs** → Use MCP Tools tab to run `tide_list` and copy a tide_id
    2. **Test Agent Services** → Use API Tests tab with the tide_id to test insights, questions, etc.
    3. **Chat with Agent** → Use Agent Chat tab for conversational testing
    4. **Monitor Results** → Use Monitoring tab to review recent activity and test results
    """)
    
    st.markdown("---")
    
    # Tab-specific help
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("🔧 MCP Tools")
        st.markdown("""
        **Purpose:** Get tide IDs from the MCP server
        
        **How to use:**
        1. Select `tide_list` from the dropdown
        2. Click "Execute Tool"
        3. Copy a `tide_id` from the results
        4. Use this ID in other tabs
        
        **Available Tools:**
        - `tide_list` - Get available tide IDs
        - `tide_create` - Create new tides
        - `tide_flow` - Manage flow states
        - And 5 more tide management tools
        """)
        
        st.subheader("🧪 API Tests")
        st.markdown("""
        **Purpose:** Test individual agent services
        
        **How to use:**
        1. Enter a tide_id (from MCP Tools)
        2. Select a service to test
        3. Fill in parameters if needed
        4. Click "Run Test"
        5. Review the response data
        
        **Available Services:**
        - Insights - Analytics and patterns
        - Optimize - Schedule recommendations
        - Questions - Productivity Q&A
        - Reports - Detailed summaries
        - Chat - Direct agent communication
        """)
    
    with col2:
        st.subheader("💬 Agent Chat")
        st.markdown("""
        **Purpose:** Conversational testing with the agent
        
        **How to use:**
        1. Enter a tide_id (optional, uses default if empty)
        2. Type your message
        3. Press Enter or click Send
        4. Agent responds conversationally
        
        **Tips:**
        - Ask about productivity patterns
        - Request schedule optimization
        - Inquire about specific time periods
        - Test natural language understanding
        """)
        
        st.subheader("📊 Monitoring")
        st.markdown("""
        **Purpose:** Track testing activity and results
        
        **Features:**
        - Environment status
        - Recent chat messages
        - Last API test results
        - Debug information
        
        **Use for:**
        - Verifying test execution
        - Debugging failed requests
        - Tracking conversation flow
        """)
    
    st.markdown("---")
    
    # Environment info
    st.subheader("🌐 Environment Configuration")
    st.info("""
    **Current Environment: Stable Testing**
    
    - **Agent Server:** `tides-agent-102.mpazbot.workers.dev`
    - **MCP Server:** `tides-006.mpazbot.workers.dev/mcp`
    - **API Key:** Pre-configured for testing
    
    This is the stable environment recommended for iOS team testing.
    """)
    
    # Troubleshooting
    st.subheader("🔧 Troubleshooting")
    with st.expander("Common Issues"):
        st.markdown("""
        **"No tide data found"**
        - Make sure you're using a valid tide_id from the MCP Tools tab
        - Try running `tide_list` to get fresh IDs
        
        **"API key required"**
        - The API key should be pre-configured
        - Check the sidebar configuration status
        
        **"Connection failed"**
        - Verify the agent server is running
        - Check network connectivity
        - Try the "Test Connection" button in the sidebar
        
        **Agent not responding conversationally**
        - Make sure you're using the Agent Chat tab, not API Tests
        - Try asking natural questions about productivity
        - Verify you have recent tide data
        """)