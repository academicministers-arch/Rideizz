import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.rides.router import router as rides_router
from app.modules.school.router import router as school_router
from app.modules.travel.router import router as travel_router
from app.modules.shared.router import router as shared_router
from app.modules.admin.router import router as admin_router
from app.modules.maps.router import router as maps_router
from app.modules.delivery.router import router as delivery_router

app = FastAPI(title="Rideizzy API")

origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shared_router)
app.include_router(rides_router)
app.include_router(school_router)
app.include_router(travel_router)
app.include_router(admin_router)
app.include_router(maps_router)
app.include_router(delivery_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "rideizzy-api"}