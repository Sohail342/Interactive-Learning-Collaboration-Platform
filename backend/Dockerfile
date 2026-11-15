
FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Configure uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy dependency files first
COPY pyproject.toml uv.lock ./

# Install dependencies from lockfile
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

# Activate project virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "collabaration_app.main:app", "--host", "0.0.0.0", "--port", "8000"]
