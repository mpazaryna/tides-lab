# Tides Streamlit Client

A comprehensive Streamlit interface for interacting with the Tides Agent and MCP Server.

## Features

- 💬 **Agent Chat Interface** - Interactive chat with the Tides productivity assistant
- 🔧 **MCP Tools** - Direct access to MCP server tools (placeholder)
- 📊 **Monitoring** - Real-time activity tracking and system status
- 🔄 **Environment Switching** - Easy switching between dev/staging/prod
- 🔐 **Authentication** - Support for bearer token authentication

## Setup

### Install uv (if not already installed)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Install dependencies with uv
```bash
cd apps/demo/st_client
uv sync
```

## Running the App

### With uv
```bash
uv run streamlit run app.py
```

Or activate the virtual environment:
```bash
source .venv/bin/activate  # On Unix/macOS
# or
.venv\Scripts\activate  # On Windows

streamlit run app.py
```

## Usage

1. **Launch App**: Start the Streamlit interface
2. **Enter Tide ID**: Get from MCP Tools tab or use default
3. **Chat with Agent**: Use the chat interface to test agent responses
4. **Test APIs**: Use API Tests tab for individual service testing

## Environment Configuration

The app is configured to use the stable testing environment:
- **Agent Server**: `https://tides-agent-102.mpazbot.workers.dev`
- **MCP Server**: `https://tides-006.mpazbot.workers.dev/mcp`

## Development

### Run with auto-reload
```bash
uv run streamlit run app.py --server.runOnSave true
```

### Code formatting
```bash
uv run ruff format app.py
```

### Linting
```bash
uv run ruff check app.py
```

## API Endpoints

The app interacts with:
- **Agent Chat**: `POST /chat` - Send messages to the productivity assistant
- **MCP Tools**: (Coming soon) - Direct MCP server tool execution

## Notes

- The MCP Tools tab is currently a placeholder and will be implemented soon
- Authentication token is optional but recommended for production use
- All chat history is stored in Streamlit session state (cleared on refresh)