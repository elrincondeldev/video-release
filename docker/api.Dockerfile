# API + webhook: FastAPI on Lambda (Mangum). Completed in Phase 1.
# Build context: repo root -> docker build -f docker/api.Dockerfile .
FROM public.ecr.aws/lambda/python:3.12

WORKDIR ${LAMBDA_TASK_ROOT}

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ .

# main.handler = Mangum object wrapping the FastAPI app.
CMD ["main.handler"]
