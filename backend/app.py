from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import hashlib
import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import csv
from pathlib import Path

from blockchain import Blockchain
from bloom import BloomFilterManager

APP_TITLE = "Blockchain Memo Authenticator"
APP_VERSION = "1.1.0"
DATA_DIR = Path("data")
UPLOADS_DIR = Path("uploads")
ADMINS_FILE = DATA_DIR / "admins.json"
BLOCKCHAIN_FILE = DATA_DIR / "blockchain.json"
BLOOM_FILE = DATA_DIR / "memos.bloom"

# JWT settings (override via env vars in production)
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

auth_scheme = HTTPBearer(auto_error=True)

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Initialize blockchain and bloom filter with persistence
blockchain = Blockchain(storage_path=str(BLOCKCHAIN_FILE))
bloom_filter = BloomFilterManager(storage_path=str(BLOOM_FILE))

# Bootstrap admins file if missing
if not ADMINS_FILE.exists():
    with open(ADMINS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)  # list of {username, password_hash}


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_admins() -> list:
    try:
        with open(ADMINS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_admins(admins: list) -> None:
    with open(ADMINS_FILE, "w", encoding="utf-8") as f:
        json.dump(admins, f, ensure_ascii=False, indent=2)


def authenticate_user(username: str, password: str) -> bool:
    admins = load_admins()
    pw_hash = sha256_hex(password)
    for a in admins:
        if a.get("username") == username and a.get("password_hash") == pw_hash:
            return True
    return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token: no subject")
        # optionally check still exists
        admins = load_admins()
        if not any(a.get("username") == username for a in admins):
            raise HTTPException(status_code=401, detail="User no longer exists")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# --------------- Utility ---------------

def compute_file_hash(file_content: bytes) -> str:
    """Compute SHA-256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()


def load_students_data() -> Dict[str, Dict[str, Any]]:
    """Load students data from CSV file"""
    students: Dict[str, Dict[str, Any]] = {}
    csv_path = Path("students.csv")
    if not csv_path.exists():
        return students
    try:
        with open(csv_path, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                students[row["id"]] = {
                    "name": row.get("name", ""),
                    "national_id": row.get("national_id", ""),
                    "college": row.get("college", ""),
                }
    except Exception as e:
        print(f"Error loading students data: {e}")
    return students


# --------------- Public Endpoints ---------------

@app.get("/")
async def root():
    return {"message": f"{APP_TITLE} API", "version": APP_VERSION}


# --------------- Auth Endpoints ---------------

@app.post("/auth/register")
async def register(username: str = Form(...), password: str = Form(...)):
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    admins = load_admins()
    if any(a.get("username") == username for a in admins):
        raise HTTPException(status_code=400, detail="Username already exists")
    admins.append({"username": username, "password_hash": sha256_hex(password)})
    save_admins(admins)
    return {"status": "registered"}


@app.post("/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if not authenticate_user(username, password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": username})
    return {"access_token": token, "token_type": "bearer"}


# --------------- Protected: Upload & Verify ---------------

@app.post("/upload_memo")
async def upload_memo(
    current_admin: str = Depends(get_current_admin),
    file: UploadFile = File(...),
    student_id: str = Form(...),
    student_name: str = Form(...),
    college: str = Form(...),
    verified: Optional[bool] = Form(True),
):
    """Upload a PDF/image memo, compute hash, update bloom + blockchain, save file as <hash>.<ext>."""
    try:
        # Validate file type
        if not file.content_type or not (file.content_type.startswith("application/pdf") or file.content_type.startswith("image/")):
            raise HTTPException(status_code=400, detail="Only PDF and image files are allowed")

        # Read file content
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")

        # Compute hash
        file_hash = compute_file_hash(content)

        # Duplicate check via bloom + chain
        exists_bloom = bloom_filter.might_exist(file_hash)
        block_index = blockchain.find_hash(file_hash) if exists_bloom else None
        if block_index is not None:
            return JSONResponse({
                "status": "exists",
                "message": "File already exists in blockchain",
                "hash": file_hash,
                "block_index": block_index,
            })

        # Persist file
        file_extension = os.path.splitext(file.filename or "")[1] or ".bin"
        stored_filename = f"{file_hash}{file_extension}"
        file_path = UPLOADS_DIR / stored_filename
        with open(file_path, "wb") as f:
            f.write(content)

        # Update bloom
        bloom_filter.add(file_hash)

        # Build transaction
        tx = {
            "hash": file_hash,
            "student_id": student_id,
            "student_name": student_name,
            "verified": bool(verified) if verified is not None else True,
            "college": college,
            "tx_timestamp": datetime.now().isoformat(),
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "uploader": current_admin,
        }

        # Add block
        created_index = blockchain.add_transaction(tx)

        return JSONResponse({
            "status": "success",
            "message": "File uploaded and added to blockchain",
            "hash": file_hash,
            "block_index": created_index,
            "filename": stored_filename,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post("/verify")
async def verify(
    current_admin: str = Depends(get_current_admin),
    file: Optional[UploadFile] = File(None),
    manual_hash: Optional[str] = Form(None),
    student_id: Optional[str] = Form(None),
    student_name: Optional[str] = Form(None),
    college: Optional[str] = Form(None),
): 
    """Verify a file or hash against the blockchain. Returns detailed JSON with per-field match status.
    Color coding via status_color: green (exact match), yellow (hash exists but fields mismatch/unknown), red (not found)."""
    try:
        # Allow verification by:
        # - hash/file OR
        # - full student details (student_id + student_name + college) OR
        # - student_id only (will resolve latest memo for that ID)
        if not file and not manual_hash and not (student_id or (student_id and student_name and college)):
            raise HTTPException(status_code=400, detail="Provide a file/manual_hash, student_id, or full student details")

        # Case 1: Verify by hash/file
        if file or manual_hash:
            if file:
                content = await file.read()
                if not content:
                    raise HTTPException(status_code=400, detail="Empty file")
                computed_hash = compute_file_hash(content)
            else:
                computed_hash = manual_hash.strip().lower()
                if not all(c in "0123456789abcdef" for c in computed_hash) or len(computed_hash) != 64:
                    raise HTTPException(status_code=400, detail="manual_hash must be a 64-char hex SHA-256")

            block_index = blockchain.find_hash(computed_hash)
            exists = block_index is not None
            response: Dict[str, Any] = {
                "exists": exists,
                "hash": computed_hash,
                "block_index": block_index,
            }
        else:
            # Case 2: Verify by student details or student_id only
            found_index = None
            found_hash = None
            found_tx = None

            if student_id and not (student_name and college):
                # student_id only: resolve the latest memo for this ID
                for i in reversed(range(len(blockchain.chain))):
                    blk = blockchain.chain[i]
                    for tx in blk.transactions:
                        if tx.get("student_id") == student_id:
                            found_index = i
                            found_hash = tx.get("hash")
                            found_tx = tx
                            break
                    if found_index is not None:
                        break
            else:
                # Full match on id + name + college
                for i, blk in enumerate(blockchain.chain):
                    for tx in blk.transactions:
                        if (
                            tx.get("student_id") == student_id
                            and tx.get("student_name") == student_name
                            and tx.get("college") == college
                        ):
                            found_index = i
                            found_hash = tx.get("hash")
                            found_tx = tx
                            break
                    if found_index is not None:
                        break

            response = {
                "exists": found_index is not None,
                "block_index": found_index,
                "hash": found_hash,
                "transaction": found_tx,
            }

        match: Dict[str, Any] = {}
        # Normalize exists/block_index from response for both verification paths
        exists = bool(response.get("exists"))
        block_index = response.get("block_index") if exists else None

        if exists:
            block = blockchain.get_block(block_index)
            tx = block["transactions"][0] if block and block.get("transactions") else {}
            # Field comparisons
            def cmp_field(field: str, provided: Optional[str]):
                expected = tx.get(field)
                status = (
                    "match" if (provided is not None and expected == provided) else
                    "missing" if provided is None else
                    "mismatch"
                )
                return {"expected": expected, "provided": provided, "status": status}

            match["student_id"] = cmp_field("student_id", student_id)
            match["student_name"] = cmp_field("student_name", student_name)
            match["college"] = cmp_field("college", college)

            # Color decision
            statuses = {v["status"] for v in match.values()}
            if statuses == {"match"} or statuses == {"match", "missing"}:
                status_color = "green"
            elif "mismatch" in statuses:
                status_color = "yellow"  # hash matches but details differ
            else:
                status_color = "green"

            response.update({
                "status_color": status_color,
                "message": "Student record found in blockchain" if not (file or manual_hash) else "Hash found in blockchain",
                "block": block,
                "match": match,
            })
        else:
            # If we verified by student details, craft a message accordingly
            if not (file or manual_hash) and response.get("exists"):
                response.update({
                    "status_color": "green",
                    "message": "Student record found in blockchain",
                })
            elif not (file or manual_hash) and not response.get("exists"):
                response.update({
                    "status_color": "red",
                    "message": "No matching student record found",
                })
            else:
                response.update({
                    "status_color": "red",
                    "message": "Hash not found in blockchain",
                })

        return JSONResponse(response)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


# --------------- Public Data Endpoints ---------------

@app.get("/students/{student_id}")
async def get_student(student_id: str):
    try:
        students = load_students_data()
        student = students.get(student_id)

        # Find latest memo for this student_id in blockchain (highest block index)
        latest_index = None
        latest_tx = None
        for i, blk in enumerate(blockchain.chain):
            for tx in blk.transactions:
                if tx.get("student_id") == student_id:
                    latest_index = i
                    latest_tx = tx

        response: Dict[str, Any] = {
            "found": bool(student),
            "student": student or None,
            "memo": {
                "exists": latest_tx is not None,
                "block_index": latest_index,
                "hash": latest_tx.get("hash") if latest_tx else None,
                "transaction": latest_tx,
                "download_url": f"/students/{student_id}/memo/download" if latest_tx else None,
            },
        }

        # If memo exists, include block and comparison
        if latest_tx is not None:
            block = blockchain.get_block(latest_index)
            response["memo"]["block"] = block
            # Optional comparisons between CSV data and memo transaction
            if student:
                response["match"] = {
                    "student_name": {
                        "expected": latest_tx.get("student_name"),
                        "provided": student.get("name"),
                        "status": "match" if latest_tx.get("student_name") == student.get("name") else "mismatch",
                    },
                    "college": {
                        "expected": latest_tx.get("college"),
                        "provided": student.get("college"),
                        "status": "match" if latest_tx.get("college") == student.get("college") else "mismatch",
                    },
                }
        else:
            response["match"] = None

        return JSONResponse(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Student lookup failed: {str(e)}")


@app.get("/students/{student_id}/memo/download")
async def download_student_memo(student_id: str):
    """Download the latest memo file linked to a student_id.
    Looks up the most recent transaction for the ID and serves the stored file.
    """
    try:
        # Find the latest transaction for this student_id (from newest block backwards)
        latest_tx = None
        for i in reversed(range(len(blockchain.chain))):
            blk = blockchain.chain[i]
            for tx in blk.transactions:
                if tx.get("student_id") == student_id:
                    latest_tx = tx
                    break
            if latest_tx is not None:
                break

        if not latest_tx:
            raise HTTPException(status_code=404, detail="No memo found for this student ID")

        stored_filename = latest_tx.get("stored_filename")
        original_filename = latest_tx.get("original_filename") or f"memo_{student_id}.bin"
        if not stored_filename:
            raise HTTPException(status_code=404, detail="Stored file not recorded in memo")

        file_path = UPLOADS_DIR / stored_filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Memo file not found on server")

        return FileResponse(str(file_path), media_type="application/octet-stream", filename=original_filename)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download memo: {str(e)}")


@app.get("/blockchain")
async def get_blockchain():
    try:
        return JSONResponse({
            "summary": blockchain.summary(),
            "blocks": [b for b in (blk.to_dict() for blk in blockchain.chain)],
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch blockchain: {str(e)}")


@app.get("/export/blockchain.json")
async def export_blockchain():
    if not BLOCKCHAIN_FILE.exists():
        raise HTTPException(status_code=404, detail="Blockchain file not found")
    return FileResponse(str(BLOCKCHAIN_FILE), media_type="application/json", filename="blockchain.json")


@app.get("/export/students.json")
async def export_students_json():
    return JSONResponse(load_students_data())


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)