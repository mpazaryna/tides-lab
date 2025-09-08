"""
Chat Tab Component
Handles the agent chat interface
"""
import streamlit as st
from typing import List, Dict, Any

from ..services import AgentClient


def render_chat_tab(agent_client: AgentClient, api_key: str = None):
    """Render the agent inference interface"""
    st.header("🧠 Agent Inference")
    st.markdown("Test agent's **intelligent routing** - send natural language and let AI determine which service to call")
    
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
        for i, message in enumerate(st.session_state.messages):
            with st.chat_message(message["role"]):
                st.write(message["content"])
                
                # Show debugging info for assistant responses (like Agent Services tab)
                if message["role"] == "assistant" and "raw_response" in message:
                    
                    # Status indicators (like Agent Services tab)
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        status = "✅ Success" if message.get("status_code") == 200 else "❌ Failed"
                        st.metric("Status", status)
                    with col2:
                        processing_time = message.get("processing_time_ms", 0)
                        st.metric("Processing Time", f"{processing_time:.0f}ms")
                    with col3:
                        service = message.get("raw_response", {}).get("metadata", {}).get("service", "unknown")
                        st.metric("Service", service)
                    
                    # Raw response display (like Agent Services tab)
                    with st.expander("🔧 Raw API Response", expanded=False):
                        st.json(message["raw_response"])
                    
                    st.markdown("---")  # Separator like Agent Services tab
    else:
        st.info("💬 Start a conversation by asking a question in the text area above or using the chat input below!")
    
    # Optional: Keep the streamlit chat input for quick messages
    if prompt := st.chat_input("💬 Or type a quick message here..."):
        _process_chat_message(prompt, agent_client, api_key, tide_id)


def _process_chat_message(prompt: str, agent_client: AgentClient, api_key: str, tide_id: str):
    """Process a chat message and get agent response"""
    from datetime import datetime
    import requests
    
    # Add user message
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    # Get agent response with full debugging info
    with st.spinner("🤔 Thinking..."):
        start_time = datetime.now()
        
        # Make direct request to get full response for debugging
        try:
            payload = {
                "message": prompt,
                "userId": st.session_state.user_id or "demo_user",
                "api_key": api_key,
                "tides_id": tide_id,
                "timestamp": datetime.now().isoformat()
                # No explicit service - let AI inference determine the right service
            }
            
            response = requests.post(
                f"{agent_client.base_url}/coordinator",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=agent_client.timeout
            )
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                full_response = response.json()
                
                # Extract formatted message using agent_client logic
                formatted_response = agent_client.chat(prompt, api_key, st.session_state.user_id, tide_id)
                
                # Store both formatted and raw response
                st.session_state.messages.append({
                    "role": "assistant", 
                    "content": formatted_response,
                    "raw_response": full_response,
                    "processing_time_ms": processing_time,
                    "status_code": response.status_code
                })
            else:
                error_msg = f"❌ Agent error ({response.status_code}): {response.text[:200]}"
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": error_msg,
                    "raw_response": {"error": response.text, "status_code": response.status_code},
                    "processing_time_ms": processing_time,
                    "status_code": response.status_code
                })
                
        except Exception as e:
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds() * 1000
            error_msg = f"❌ Connection failed: {str(e)}"
            st.session_state.messages.append({
                "role": "assistant",
                "content": error_msg,
                "raw_response": {"error": str(e)},
                "processing_time_ms": processing_time,
                "status_code": None
            })
    
    st.rerun()