from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(title="AgriGuard API")

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["GET"],
  allow_headers=["*"],
)

supabase = create_client(
  os.getenv("SUPABASE_URL"),
  os.getenv("SUPABASE_KEY")
)

@app.get("/health")
def health_check():
  return {"status": "ok"}