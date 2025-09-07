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

1. **Select Environment**: Choose between Development (103), Staging (102), or Production (101)
2. **Set Authentication**: Enter your User ID and optional Auth Token
3. **Chat with Agent**: Use the chat interface or quick action buttons
4. **Monitor Activity**: View recent messages and system metrics

## Environments

- **103 - Development**: `tides-agent-103.mpazbot.workers.dev`
- **102 - Staging**: `tides-agent-102.mpazbot.workers.dev`  
- **101 - Production**: `tides-agent-101.mpazbot.workers.dev` (iOS team)

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