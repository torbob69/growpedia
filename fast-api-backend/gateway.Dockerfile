FROM python:3.13-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" httpx
COPY gateway.py .
EXPOSE 8000
CMD ["uvicorn", "gateway:app", "--host", "0.0.0.0", "--port", "8000"]
