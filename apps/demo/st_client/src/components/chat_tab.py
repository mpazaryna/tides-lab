"""
Chat Tab Component
Handles the agent chat interface
"""
import streamlit as st
from typing import List, Dict, Any

from ..services import AgentClient


def render_chat_tab(agent_client: AgentClient, api_key: str = None):
    """Render the chat interface tab"""
    st.header("💬 Agent Chat Interface")
    
    if not api_key:
        st.warning("⚠️ Please enter an API key in the sidebar to use the chat interface")
        return
    
    # Add tide_id input at the top
    tide_id = st.text_input(
        "🌊 Tide ID (from MCP tide_list):",
        value="",
        placeholder="tide_xxxxxxxxxx_yyyyyyy",
        help="Enter a tide ID from the MCP tide_list tool - leave empty for daily-tide-default",
        key="chat_tide_id"
    )
    
    # Use default if empty
    if not tide_id.strip():
        tide_id = "daily-tide-default"
    
    # Chat controls
    col1, col2 = st.columns([4, 1])
    with col1:
        st.subheader("💬 Chat with Agent")
    with col2:
        if st.button("🗑️ Clear Chat", help="Clear conversation history"):
            st.session_state.messages = []
            st.rerun()
    
    # PRIMARY: Text input for questions
    with st.form("main_chat_form", clear_on_submit=True):
        user_question = st.text_area(
            "Type your question:",
            height=120,
            placeholder="Ask about your productivity, insights, schedule optimization, or any analysis of your tide data...",
            help="Ask anything about your productivity patterns, work habits, or get personalized advice!"
        )
        col1, col2 = st.columns([1, 4])
        with col1:
            submitted = st.form_submit_button("💬 Send", type="primary", use_container_width=True)
        
        if submitted and user_question.strip():
            _process_chat_message(user_question.strip(), agent_client, api_key, tide_id)
    
    st.markdown("---")
    
    # Initialize messages if not exists
    if 'messages' not in st.session_state:
        st.session_state.messages = []
    
    # Chat messages display
    if st.session_state.messages:
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.write(message["content"])
    else:
        st.info("💬 Start a conversation by asking a question in the text area above or using the chat input below!")
    
    # Optional: Keep the streamlit chat input for quick messages
    if prompt := st.chat_input("💬 Or type a quick message here..."):
        _process_chat_message(prompt, agent_client, api_key, tide_id)


def _process_chat_message(prompt: str, agent_client: AgentClient, api_key: str, tide_id: str):
    """Process a chat message and get agent response"""
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    # Get agent response
    with st.spinner("🤔 Thinking..."):
        response = agent_client.chat(prompt, api_key, st.session_state.user_id, tide_id)
        st.session_state.messages.append({"role": "assistant", "content": response})
    
    st.rerun()