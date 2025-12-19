# TempChat

Ephemeral chat rooms. No history. No traces.

**Demo:** https://c.kotc.ca

## Privacy by Design

TempChat is built with a simple principle: **if it's not in memory, it doesn't exist.**

### What We Don't Store

- **No database** — There's no database to breach
- **No message logs** — Messages relay and vanish instantly
- **No server logs** — No record of who said what
- **No accounts** — No identity to track or leak
- **No cookies** — Nothing persists in your browser
- **No analytics** — No tracking pixels, no telemetry

### How It Works

1. Create a room, get a 4-character code
2. Share the code with someone
3. Chat in real-time via WebSocket
4. Leave — the room dies when empty

Messages pass through the server and are immediately forwarded to other participants. The server never stores message content. Room data exists only in memory and is deleted the moment the last person disconnects.

### Architecture

```
┌─────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Server    │
│  (User A)   │   WS    │  (Node.js)  │
└─────────────┘         │             │
                        │  In-memory  │
┌─────────────┐         │  room map   │
│   Browser   │◄───────►│  (no disk)  │
│  (User B)   │   WS    │             │
└─────────────┘         └─────────────┘
```

The server maintains only:
- A Map of active room codes
- Socket IDs of connected users per room

Both are purged when rooms empty.

## Run Locally

```bash
npm install
npm start
```

Open http://localhost:3000

## Docker

```bash
docker build -t tempchat .
docker run -p 3000:3000 tempchat
```

## Kubernetes

```bash
kubectl apply -f k8s.yaml
```

Image: `ghcr.io/kotcsolutions/tempchat:1.1.0`

## Self-Hosting Notes

For true privacy:
- Run behind a reverse proxy that doesn't log, or strip logs
- Use TLS termination at the proxy level
- Consider running on infrastructure you control

## License

MIT
