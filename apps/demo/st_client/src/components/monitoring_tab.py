"""
Monitoring Tab Component
System monitoring and activity tracking
"""
import streamlit as st
from datetime import datetime


def render_monitoring_tab():
    """Render the monitoring dashboard"""
    st.header("System Monitoring")
    
    # System metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        env_name = st.session_state.environment.split(" - ")[1]
        st.metric("Environment", env_name)
    with col2:
        message_count = len(st.session_state.messages)
        st.metric("Messages", message_count)
    with col3:
        st.metric("User ID", st.session_state.user_id)
    
    # Connection status
    st.subheader("Connection Status")
    col1, col2 = st.columns(2)
    with col1:
        st.success("🟢 Agent Connection: Active")
    with col2:
        st.warning("🟡 MCP Connection: Not implemented")
    
    # Recent activity
    st.subheader("Recent Activity")
    _render_activity_log()
    
    # Performance metrics
    st.subheader("Performance Metrics")
    _render_performance_metrics()
    
    # Session information
    st.subheader("Session Information")
    _render_session_info()


def _render_activity_log():
    """Render recent activity log"""
    if st.session_state.messages:
        recent_messages = st.session_state.messages[-10:]  # Last 10 messages
        
        for i, msg in enumerate(recent_messages):
            timestamp = datetime.now().strftime("%H:%M:%S")  # In a real app, store actual timestamps
            
            if msg["role"] == "user":
                content_preview = msg["content"][:50]
                st.text(f"[{timestamp}] 👤 User: {content_preview}{'...' if len(msg['content']) > 50 else ''}")
            else:
                content_preview = str(msg["content"])[:50]
                st.text(f"[{timestamp}] 🤖 Agent: {content_preview}{'...' if len(str(msg['content'])) > 50 else ''}")
    else:
        st.info("No activity yet. Start a conversation to see activity logs.")


def _render_performance_metrics():
    """Render performance metrics"""
    # Placeholder metrics - in a real app, these would be calculated from actual data
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Avg Response Time", "1.2s", delta="-0.3s")
    with col2:
        st.metric("Success Rate", "98.5%", delta="2.1%")
    with col3:
        st.metric("Total Requests", "42", delta="12")
    with col4:
        st.metric("Uptime", "99.9%", delta="0.0%")


def _render_session_info():
    """Render current session information"""
    col1, col2 = st.columns(2)
    
    with col1:
        st.info(f"""
        **Session Details:**
        - Environment: {st.session_state.environment}
        - User ID: {st.session_state.user_id}
        - Messages: {len(st.session_state.messages)}
        - Auth Token: {'Set' if st.session_state.auth_token else 'Not set'}
        """)
    
    with col2:
        # Test results summary
        if 'last_test_result' in st.session_state:
            result = st.session_state.last_test_result
            st.info(f"""
            **Last API Test:**
            - Service: {result['service']}
            - Status: {'✅ Success' if 'error' not in result['result'] else '❌ Failed'}
            - Time: {result['processing_time_ms']:.0f}ms
            - Timestamp: {result['timestamp'][:19]}
            """)
        else:
            st.info("**Last API Test:** None")
    
    # Debug information
    with st.expander("🔍 Debug Information"):
        st.json({
            "session_state_keys": list(st.session_state.keys()),
            "environment_config": st.session_state.get("environment", "Not set"),
            "message_count": len(st.session_state.messages),
            "has_test_results": 'last_test_result' in st.session_state
        })