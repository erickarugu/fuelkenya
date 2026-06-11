import os
from uvicorn import run

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    run("app.main:app", host="0.0.0.0", port=port, reload=True)
