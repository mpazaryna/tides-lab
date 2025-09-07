"""
MCP Tools Tab Component
Interface for MCP server tools
"""
import streamlit as st

from ..services.mcp_client import MCPClient


def render_mcp_tools_tab(environment: str, api_key: str = None):
    """Render the MCP tools interface"""
    st.header("MCP Tools Interface")
    
    if not api_key:
        st.warning("⚠️ Please enter an API key in the sidebar to use MCP tools")
        return
    
    # Initialize MCP client
    mcp_client = MCPClient(environment)
    
    # Placeholder for MCP tools
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.subheader("Available Tools")
        tools = mcp_client.list_tools()
        
        if tools:
            selected_tool = st.selectbox(
                "Select a tool", 
                [tool["name"] for tool in tools]
            )
            
            # Find the selected tool details
            tool_info = next((t for t in tools if t["name"] == selected_tool), None)
            if tool_info:
                st.markdown(f"**Description:** {tool_info['description']}")
        else:
            st.warning("No MCP tools available")
            selected_tool = None
    
    with col2:
        if selected_tool:
            st.subheader(f"Tool: {selected_tool}")
            st.markdown("Tool parameters and execution will be implemented here.")
            
            # Placeholder form based on tool type
            with st.form(f"{selected_tool}_form"):
                if "create" in selected_tool:
                    st.text_input("Title", key=f"{selected_tool}_title")
                    st.text_area("Description", key=f"{selected_tool}_desc")
                elif "list" in selected_tool:
                    st.selectbox("Filter", ["All", "Active", "Completed"], key=f"{selected_tool}_filter")
                elif "add" in selected_tool:
                    st.number_input("Energy Level", min_value=1, max_value=10, key=f"{selected_tool}_energy")
                else:
                    st.text_input("Parameter 1", key=f"{selected_tool}_p1")
                    st.text_input("Parameter 2", key=f"{selected_tool}_p2")
                
                submitted = st.form_submit_button("Execute Tool")
                if submitted:
                    _execute_mcp_tool(mcp_client, selected_tool, api_key)
        else:
            st.info("Select a tool to see its parameters")


def _execute_mcp_tool(mcp_client: MCPClient, tool_name: str, api_key: str):
    """Execute an MCP tool"""
    # Build parameters based on tool type
    parameters = {}
    
    if tool_name == "tide_list":
        # tide_list takes optional filter parameters
        filter_type = st.session_state.get(f"{tool_name}_filter", "All")
        if filter_type != "All":
            parameters["active_only"] = (filter_type == "Active")
    elif "create" in tool_name:
        title = st.session_state.get(f"{tool_name}_title", "")
        description = st.session_state.get(f"{tool_name}_desc", "")
        if title:
            parameters["title"] = title
        if description:
            parameters["description"] = description
    elif "add" in tool_name and "energy" in tool_name:
        energy = st.session_state.get(f"{tool_name}_energy", 5)
        parameters["energy_level"] = energy
    
    with st.spinner(f"Executing {tool_name}..."):
        result = mcp_client.execute_tool(tool_name, parameters, api_key)
        
        if result.get("status") == "success":
            st.success(f"✅ {tool_name} executed successfully!")
            
            # Display raw JSON response
            tool_result = result.get("result")
            if tool_result:
                st.json(tool_result)
            else:
                st.info("Tool executed but returned no data.")
        elif result.get("status") == "error":
            st.error(f"❌ Error executing {tool_name}:")
            error_msg = result.get("error", "Unknown error")
            st.code(error_msg, language="text")
        else:
            st.warning(f"⚠️ Unexpected response from {tool_name}")
            st.json(result)