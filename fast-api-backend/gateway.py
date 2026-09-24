import os

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

app = FastAPI()

client = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=5.0))

SERVICES = {
    "vector": os.getenv("VECTOR_SERVICE_URL", "http://127.0.0.1:8001"),
    "chat": os.getenv("CHAT_SERVICE_URL", "http://127.0.0.1:8002"),
    "auth": os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8003"),
    "user": os.getenv("USER_SERVICE_URL", "http://127.0.0.1:8004"),
}

@app.get('/health')
def health():
    return "p"

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(service: str, path: str, request: Request):
    base_url = SERVICES.get(service)
    if base_url is None:
        return JSONResponse({"detail": f"unknown service: {service}"}, status_code=404)

    try:
        upstream = await client.request(
            request.method,
            f"{base_url}/{path}",
            params=request.query_params,
            headers={k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")},
            content=await request.body(),
        )
    except httpx.TimeoutException:
        return JSONResponse({"detail": f"{service} service timed out"}, status_code=504)
    except httpx.RequestError:
        return JSONResponse({"detail": f"{service} service unreachable"}, status_code=503)
    excluded = {"content-encoding", "transfer-encoding", "connection", "content-length"}
    headers = {k: v for k, v in upstream.headers.items() if k.lower() not in excluded}
    return Response(content=upstream.content, status_code=upstream.status_code, headers=headers)
