import os
import sys
import uvicorn

sys.path.insert(0, os.path.dirname(__file__))
from app.config import settings

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
