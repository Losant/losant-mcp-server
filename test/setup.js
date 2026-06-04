// Set test environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.LOSANT_RESOURCE_URL = process.env.LOSANT_RESOURCE_URL || 'https://mcp.losant.test';
process.env.LOSANT_AUTH_SERVER_URL = process.env.LOSANT_AUTH_SERVER_URL || 'https://api.losant.test';
process.env.LOSANT_API_URL = process.env.LOSANT_API_URL || 'https://api.losant.test';
process.env.HOST = process.env.HOST || '0.0.0.0';
process.env.ENABLE_OAUTH = process.env.ENABLE_OAUTH || 'true';
