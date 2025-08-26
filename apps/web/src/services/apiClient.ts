// API Client Template - Copy this into each app's services directory
// DO NOT import this file directly due to Metro bundler limitations

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseUrl: string = process.env.MCP_SERVER_URL || '',
    authToken?: string
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async mcpRequest<T>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const request = {
      jsonrpc: '2.0' as const,
      method,
      params,
      id: Date.now(),
    };

    return this.request<T>('/mcp', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}