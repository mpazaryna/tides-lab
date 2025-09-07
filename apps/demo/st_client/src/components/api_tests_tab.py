"""
API Tests Tab Component
Comprehensive testing interface for agent services
"""
import streamlit as st
from datetime import datetime
from typing import Dict, Any

from ..services import AgentClient
from ..config import SERVICE_DEFINITIONS


def render_api_tests_tab(agent_client: AgentClient, api_key: str = None):
    """Render the API testing interface"""
    st.header("🧪 API Testing Suite")
    st.markdown("Point-and-click testing for all Tides agent services")
    
    if not api_key:
        st.warning("⚠️ Please enter an API key in the sidebar to run API tests")
        return
    
    # Add tide_id input at the top
    tide_id = st.text_input(
        "🌊 Tide ID (from MCP tide_list):",
        value="tide_1757218619970_gyrpyxie6bm",
        help="Enter a tide ID from the MCP tide_list tool or use the default"
    )
    
    # Test configuration
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Available Services")
        
        # Service selection
        selected_service = st.selectbox(
            "Select a service to test:",
            options=list(SERVICE_DEFINITIONS.keys()),
            format_func=lambda x: SERVICE_DEFINITIONS[x]["name"]
        )
        
        st.info(f"**Description:** {SERVICE_DEFINITIONS[selected_service]['description']}")
    
    with col2:
        st.subheader("Test Parameters")
        test_params = _render_service_parameters(selected_service)
    
    st.markdown("---")
    
    # Test execution buttons
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button(f"🚀 Test {SERVICE_DEFINITIONS[selected_service]['name']}", type="primary"):
            _execute_single_test(agent_client, selected_service, test_params, api_key, tide_id)
    
    with col2:
        if st.button("📋 Quick Test Suite"):
            _execute_test_suite(agent_client, api_key, tide_id)
    
    with col3:
        if st.button("🗑️ Clear Results"):
            _clear_test_results()
    
    # Display test results
    _render_test_results()
    
    # Quick test suite runner
    if st.session_state.get('running_suite', False):
        suite_api_key = st.session_state.get('suite_api_key', api_key)
        suite_tide_id = st.session_state.get('suite_tide_id', tide_id)
        _render_test_suite_runner(agent_client, suite_api_key, suite_tide_id)


def _render_service_parameters(service: str) -> Dict[str, Any]:
    """Render parameter inputs for the selected service"""
    params = {}
    service_params = SERVICE_DEFINITIONS[service]["params"]
    
    if "timeframe" in service_params:
        params["timeframe"] = st.selectbox(
            "Timeframe:",
            ["7d", "30d", "90d"],
            index=0
        )
    
    if "question" in service_params:
        params["question"] = st.text_input(
            "Question:",
            value="How productive was I today?"
        )
    
    if "message" in service_params:
        params["message"] = st.text_input(
            "Message:",
            value="How productive was I today?"
        )
    
    if "r2_path" in service_params:
        params["r2_path"] = st.text_input(
            "R2 File Path:",
            value="users/19874fa5-4a50-4dc4-9fea-ab4abf272ce1/tides/tide_1756412347954_wgq624k2ocf.json",
            help="Full path to the R2 object"
        )
    
    return params


def _execute_single_test(agent_client: AgentClient, service: str, params: Dict[str, Any], api_key: str, tide_id: str):
    """Execute a single service test"""
    with st.spinner(f"Testing {service} service..."):
        start_time = datetime.now()
        result = agent_client.call_service(service, api_key, tide_id=tide_id, **params)
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds() * 1000
        
        # Store result in session state
        st.session_state.last_test_result = {
            "service": service,
            "environment": agent_client.environment,
            "params": params,
            "tide_id": tide_id,
            "result": result,
            "processing_time_ms": processing_time,
            "timestamp": end_time.isoformat()
        }


def _execute_test_suite(agent_client: AgentClient, api_key: str, tide_id: str):
    """Start the quick test suite"""
    st.session_state.running_suite = True
    st.session_state.suite_api_key = api_key  # Store API key for suite
    st.session_state.suite_tide_id = tide_id  # Store tide_id for suite
    st.rerun()


def _clear_test_results():
    """Clear all test results"""
    for key in ['last_test_result', 'test_history']:
        if key in st.session_state:
            del st.session_state[key]
    st.rerun()


def _render_test_results():
    """Render test results if available"""
    if 'last_test_result' not in st.session_state:
        return
    
    st.markdown("---")
    st.subheader("🔍 Test Results")
    
    result = st.session_state.last_test_result
    
    # Status indicators
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        success = "error" not in result["result"]
        st.metric("Status", "✅ Success" if success else "❌ Failed")
    with col2:
        st.metric("Processing Time", f"{result['processing_time_ms']:.0f}ms")
    with col3:
        st.metric("Service", result["service"])
    with col4:
        st.metric("Environment", result["environment"].split(" - ")[1])
    
    # Response display
    if "error" in result["result"]:
        st.error(f"**Error:** {result['result']['error']}")
        if "details" in result["result"]:
            with st.expander("Error Details"):
                st.code(result["result"]["details"])
    else:
        # Success response
        if "response" in result["result"]:
            st.success("**Response:**")
            st.write(result["result"]["response"])
        
        # Show metadata
        if "metadata" in result["result"]:
            with st.expander("📊 Response Metadata", expanded=True):
                st.json(result["result"]["metadata"])
        
        # Raw response
        with st.expander("🔧 Raw API Response"):
            st.json(result["result"])


def _render_test_suite_runner(agent_client: AgentClient, api_key: str, tide_id: str):
    """Render the quick test suite runner"""
    st.markdown("---")
    st.subheader("🔄 Running Quick Test Suite")
    
    quick_tests = [
        ("insights", {"timeframe": "7d"}),
        ("questions", {"question": "How can I be more productive?"}),
        ("preferences", {}),
        ("chat", {"message": "Hello, how are you?"})
    ]
    
    progress_bar = st.progress(0)
    results_container = st.container()
    
    for i, (service, params) in enumerate(quick_tests):
        progress_bar.progress((i + 1) / len(quick_tests))
        
        with results_container:
            st.write(f"Testing {service}...")
            result = agent_client.call_service(service, api_key, tide_id=tide_id, **params)
            
            if "error" in result:
                st.error(f"❌ {service}: {result['error']}")
                # Show error details if available
                if "details" in result:
                    with st.expander(f"🔍 {service} Error Details"):
                        st.code(result["details"], language="text")
            else:
                st.success(f"✅ {service}: OK")
                # Show the actual response content
                with st.expander(f"📄 {service} Response", expanded=True):
                    # Extract and display the main response content
                    if "data" in result:
                        # Handle structured responses with data field
                        data = result["data"]
                        if isinstance(data, dict):
                            # For insights service - show key metrics
                            if service == "insights" and "productivity_score" in data:
                                st.metric("Productivity Score", data["productivity_score"])
                                if "recommendations" in data:
                                    st.write("**Recommendations:**")
                                    for rec in data["recommendations"][:2]:  # Show first 2
                                        st.write(f"• {rec}")
                            # For chat service - show the message
                            elif service == "chat" and "message" in data:
                                st.write(f"**Chat Response:** {data['message']}")
                            # For questions service - show the answer
                            elif service == "questions" and "answer" in data:
                                st.write(f"**Answer:** {data['answer']}")
                            else:
                                # Generic data display
                                st.json(data)
                        else:
                            st.write(data)
                    elif "response" in result:
                        # Handle direct response field
                        st.write(f"**Response:** {result['response']}")
                    else:
                        # Show raw result for other formats
                        st.json(result)
    
    st.session_state.running_suite = False
    st.success("🎉 Quick test suite completed!")