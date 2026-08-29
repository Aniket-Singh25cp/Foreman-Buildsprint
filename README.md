# Foreman-Buildsprint
Project for BuildSprint by using LatentStack.

## Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables (optional):
   ```bash
   cp .env.example .env
   ```

3. Run the server locally:
   ```bash
   uvicorn main:app --reload
   ```

4. API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

