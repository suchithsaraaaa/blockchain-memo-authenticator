from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import hashlib
import os
import json
from datetime import datetime
from typing import Dict, Any
import csv
from pathlib import Path

from blockchain import Blockchain
from bloom import BloomFilterManager

app = FastAPI(title="Blockchain Memo Authenticator", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize blockchain and bloom filter
blockchain = Blockchain()
bloom_filter = BloomFilterManager()

# Ensure directories exist
os.makedirs("files", exist_ok=True)

def compute_file_hash(file_content: bytes) -> str:
    """Compute SHA-256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()

def load_students_data() -> Dict[str, Dict[str, Any]]:
    """Load students data from CSV file"""
    students = {}
    csv_path = Path("students.csv")
    
    if not csv_path.exists():
        return students
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                students[row['id']] = {
                    'name': row['name'],
                    'national_id': row['national_id'],
                    'college': row['college']
                }
    except Exception as e:
        print(f"Error loading students data: {e}")
    
    return students

@app.get("/")
async def root():
    return {"message": "Blockchain Memo Authenticator API", "version": "1.0.0"}

@app.post("/upload_memo")
async def upload_memo(file: UploadFile = File(...)):
    """Upload a memo file and add to blockchain if new"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith(('application/pdf', 'image/')):
            raise HTTPException(status_code=400, detail="Only PDF and image files are allowed")
        
        # Read file content
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Compute hash
        file_hash = compute_file_hash(content)
        
        # Check if hash exists in bloom filter
        if bloom_filter.might_exist(file_hash):
            # Double-check in blockchain
            block_index = blockchain.find_hash(file_hash)
            if block_index is not None:
                return JSONResponse({
                    "status": "exists",
                    "message": "File already exists in blockchain",
                    "hash": file_hash,
                    "block_index": block_index
                })
        
        # File is new - add to bloom filter and blockchain
        bloom_filter.add(file_hash)
        
        # Save file locally
        file_extension = os.path.splitext(file.filename)[1] if file.filename else '.bin'
        filename = f"{file_hash}{file_extension}"
        file_path = os.path.join("files", filename)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Add transaction to blockchain
        transaction = {
            "hash": file_hash,
            "verified": True,
            "filename": file.filename,
            "file_path": filename,
            "timestamp": datetime.now().isoformat()
        }
        
        block_index = blockchain.add_transaction(transaction)
        
        return JSONResponse({
            "status": "success",
            "message": "File uploaded and added to blockchain",
            "hash": file_hash,
            "block_index": block_index,
            "filename": filename
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/verify/{hash}")
async def verify_hash(hash: str):
    """Verify if a hash exists in the blockchain"""
    try:
        block_index = blockchain.find_hash(hash)
        
        if block_index is not None:
            block = blockchain.get_block(block_index)
            return JSONResponse({
                "exists": True,
                "block_index": block_index,
                "block": block,
                "message": "Hash found in blockchain"
            })
        else:
            return JSONResponse({
                "exists": False,
                "message": "Hash not found in blockchain"
            })
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.get("/students/{student_id}")
async def get_student(student_id: str):
    """Get student details by ID"""
    try:
        students = load_students_data()
        
        if student_id in students:
            return JSONResponse({
                "found": True,
                "student": students[student_id]
            })
        else:
            return JSONResponse({
                "found": False,
                "message": "Student not found"
            })
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Student lookup failed: {str(e)}")

@app.get("/blockchain/stats")
async def get_blockchain_stats():
    """Get blockchain statistics"""
    return JSONResponse({
        "total_blocks": len(blockchain.chain),
        "total_transactions": blockchain.get_total_transactions(),
        "latest_block": blockchain.get_latest_block()
    })

@app.get("/blockchain/blocks")
async def get_all_blocks():
    """Get all blockchain blocks"""
    return JSONResponse({
        "blocks": blockchain.chain
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
