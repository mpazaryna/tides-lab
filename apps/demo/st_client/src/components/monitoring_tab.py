"""
Monitoring Tab Component
System monitoring and activity tracking
"""
import streamlit as st
from datetime import datetime


def render_monitoring_tab():
    """Render the monitoring dashboard"""
    st.header("System Monitoring")
    
    # System metrics - simplified
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Environment", "Stable Testing")
    with col2:
        message_count = len(st.session_state.messages)
        st.metric("Chat Messages", message_count)
    
    # Recent activity
    st.subheader("Recent Activity")
    _render_activity_log()
    
    # Last API test results
    st.subheader("Last API Test")
    _render_last_test_result()
    
    # Debug information
    with st.expander("🔍 Debug Information"):
        st.json({
            "session_state_keys": list(st.session_state.keys()),
            "environment": "Stable Testing",
            "message_count": len(st.session_state.messages),
            "has_test_results": 'last_test_result' in st.session_state
        })


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


def _render_last_test_result():
    """Render the last API test result"""
    if 'last_test_result' in st.session_state:
        result = st.session_state.last_test_result
        
        # Status indicator
        if 'error' not in result['result']:
            st.success(f"✅ {result['service']} - Success ({result['processing_time_ms']:.0f}ms)")
        else:
            st.error(f"❌ {result['service']} - Failed ({result['processing_time_ms']:.0f}ms)")
        
        # Timestamp
        st.caption(f"Last run: {result['timestamp'][:19]}")
    else:
        st.info("No API tests run yet. Use the API Tests tab to run a service test.")