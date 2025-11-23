# API Reference

Complete API documentation for Claude Code Analytics Dashboard.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: Configure via `VITE_API_BASE_URL` environment variable

## Analytics Endpoints

### Get Overview Analytics

Retrieve high-level summary of all analytics data.

```http
GET /api/analytics/overview
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string (ISO 8601) | No | Start date for filtering |
| `dateTo` | string (ISO 8601) | No | End date for filtering |

**Response:**

```json
{
  "success": true,
  "data": {
    "totalSessions": 1234,
    "totalCost": 45.67,
    "totalTokens": 567890,
    "inputTokens": 234567,
    "outputTokens": 333323,
    "avgSessionDuration": 1200,
    "topModels": [
      {
        "model": "claude-sonnet-4-5-20250929",
        "count": 856,
        "percentage": 69.4
      }
    ],
    "dateRange": {
      "from": "2025-08-25T00:00:00.000Z",
      "to": "2025-11-23T23:59:59.999Z"
    }
  }
}
```

### Get Sessions

Retrieve paginated list of sessions with optional filtering.

```http
GET /api/analytics/sessions
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string (ISO 8601) | No | Start date for filtering |
| `dateTo` | string (ISO 8601) | No | End date for filtering |
| `limit` | number | No | Number of results per page (default: 20) |
| `offset` | number | No | Number of results to skip (default: 0) |

**Response:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-string",
        "projectPath": "/Users/username/project",
        "startTime": "2025-11-23T10:00:00.000Z",
        "endTime": "2025-11-23T10:30:00.000Z",
        "duration": 1800,
        "inputTokens": 1500,
        "outputTokens": 800,
        "cacheCreationTokens": 200,
        "cacheReadTokens": 300,
        "cost": 0.45,
        "model": "claude-sonnet-4-5-20250929"
      }
    ],
    "pagination": {
      "total": 1234,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### Get Session Details

Retrieve detailed information about a specific session.

```http
GET /api/analytics/sessions/:id
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Session ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid-string",
      "projectPath": "/Users/username/project",
      "startTime": "2025-11-23T10:00:00.000Z",
      "endTime": "2025-11-23T10:30:00.000Z",
      "duration": 1800,
      "inputTokens": 1500,
      "outputTokens": 800,
      "cost": 0.45,
      "model": "claude-sonnet-4-5-20250929"
    },
    "messages": [
      {
        "id": "uuid-string",
        "sessionId": "uuid-string",
        "timestamp": "2025-11-23T10:00:00.000Z",
        "role": "user",
        "content": "Help me debug this function",
        "inputTokens": 15,
        "outputTokens": 0
      },
      {
        "id": "uuid-string",
        "sessionId": "uuid-string",
        "timestamp": "2025-11-23T10:01:00.000Z",
        "role": "assistant",
        "content": "I'll help you debug the function...",
        "inputTokens": 0,
        "outputTokens": 250
      }
    ]
  }
}
```

### Get Daily Usage

Retrieve daily aggregated usage statistics.

```http
GET /api/analytics/daily-usage
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string (ISO 8601) | No | Start date for filtering |
| `dateTo` | string (ISO 8601) | No | End date for filtering |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-23",
      "sessions": 15,
      "inputTokens": 12500,
      "outputTokens": 8900,
      "cost": 4.56,
      "avgDuration": 1350
    },
    {
      "date": "2025-11-22",
      "sessions": 12,
      "inputTokens": 10200,
      "outputTokens": 7100,
      "cost": 3.78,
      "avgDuration": 1200
    }
  ]
}
```

### Get Model Distribution

Retrieve usage breakdown by Claude model.

```http
GET /api/analytics/model-distribution
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string (ISO 8601) | No | Start date for filtering |
| `dateTo` | string (ISO 8601) | No | End date for filtering |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "model": "claude-sonnet-4-5-20250929",
      "count": 856,
      "percentage": 69.4,
      "totalCost": 31.45,
      "totalTokens": 456789
    },
    {
      "model": "claude-3-5-sonnet-20241022",
      "count": 234,
      "percentage": 19.0,
      "totalCost": 8.92,
      "totalTokens": 123456
    },
    {
      "model": "claude-3-5-haiku-20241022",
      "count": 144,
      "percentage": 11.6,
      "totalCost": 2.34,
      "totalTokens": 78901
    }
  ]
}
```

### Get Tool Usage

Retrieve statistics on tool usage across sessions.

```http
GET /api/analytics/tool-usage
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string (ISO 8601) | No | Start date for filtering |
| `dateTo` | string (ISO 8601) | No | End date for filtering |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "tool": "Read",
      "count": 1523,
      "percentage": 32.4
    },
    {
      "tool": "Edit",
      "count": 987,
      "percentage": 21.0
    },
    {
      "tool": "Bash",
      "count": 645,
      "percentage": 13.7
    }
  ]
}
```

## Sync Management Endpoints

### Get Sync Status

Retrieve current synchronization status.

```http
GET /api/sync/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "lastSync": "2025-11-23T09:00:00.000Z",
    "isRunning": false,
    "lastSyncDuration": 12500,
    "lastSyncStats": {
      "filesProcessed": 45,
      "sessionsAdded": 12,
      "messagesAdded": 234,
      "errors": 0
    }
  }
}
```

### Preview Pending Changes

Preview what would be synced without actually syncing.

```http
GET /api/sync/preview
```

**Response:**

```json
{
  "success": true,
  "data": {
    "pendingFiles": [
      {
        "path": "/Users/username/.claude/projects/project1/session.jsonl",
        "lastModified": "2025-11-23T10:30:00.000Z",
        "estimatedSessions": 3,
        "estimatedMessages": 45
      }
    ],
    "totalPendingFiles": 5,
    "estimatedNewSessions": 8,
    "estimatedNewMessages": 156
  }
}
```

### Get Database Statistics

Retrieve database storage and retention statistics.

```http
GET /api/sync/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalSessions": 1234,
    "totalMessages": 12345,
    "oldestSession": "2025-08-25T00:00:00.000Z",
    "newestSession": "2025-11-23T10:30:00.000Z",
    "databaseSize": "45.6 MB",
    "retentionDays": 90
  }
}
```

### Start Data Synchronization

Start the data synchronization process.

```http
POST /api/sync/run
```

**Request Body:**

```json
{
  "incremental": true,
  "dryRun": false
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `incremental` | boolean | No | Only sync new/modified files (default: true) |
| `dryRun` | boolean | No | Preview changes without applying (default: false) |

**Response:**

```json
{
  "success": true,
  "data": {
    "started": true,
    "syncId": "uuid-string",
    "message": "Synchronization started"
  }
}
```

### Reset Sync Metadata

Reset sync tracking metadata (useful for troubleshooting).

```http
POST /api/sync/reset
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Sync metadata reset successfully"
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `SYNC_IN_PROGRESS` | 409 | Sync already running |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limiting

Currently no rate limiting is implemented. For production deployments, consider implementing rate limiting at the reverse proxy level.

## Authentication

Currently no authentication is required as this is designed for local/personal use. For shared deployments, implement authentication middleware before the API routes.
