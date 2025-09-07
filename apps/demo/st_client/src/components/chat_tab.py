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
        value="tide_1757218619970_gyrpyxie6bm",
        help="Enter a tide ID from the MCP tide_list tool or use the default",
        key="chat_tide_id"
    )
    
    # Example prompts
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("📊 How productive was I today?"):
            _handle_quick_prompt("How productive was I today?", agent_client, api_key, tide_id)
    
    with col2:
        if st.button("⏰ When should I work?"):
            _handle_quick_prompt("When should I work tomorrow?", agent_client, api_key, tide_id)
    
    with col3:
        if st.button("🎯 Give me focus tips"):
            _handle_quick_prompt("How can I improve my focus?", agent_client, api_key, tide_id)
    
    st.markdown("---")
    
    # Chat messages display
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.write(message["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask about your productivity..."):
        # Add user message
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Get agent response
        with st.spinner("Thinking..."):
            response = agent_client.chat(prompt, api_key, st.session_state.user_id, tide_id)
            st.session_state.messages.append({"role": "assistant", "content": response})
        
        st.rerun()


def _handle_quick_prompt(prompt: str, agent_client: AgentClient, api_key: str, tide_id: str):
    """Handle quick prompt button clicks"""
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.spinner("Thinking..."):
        response = agent_client.chat(prompt, api_key, st.session_state.user_id, tide_id)
        st.session_state.messages.append({"role": "assistant", "content": response})
    st.rerun()