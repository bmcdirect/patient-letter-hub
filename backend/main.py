from fastapi import FastAPI

app = FastAPI(title="PatientLetterHub API")

@app.get("/ping", tags=["health"])
async def ping():
    return {"status": "ok"}
