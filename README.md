# Blockchain Memo Authenticator Prototype

A proof-of-concept system for memo authentication using blockchain simulation and probabilistic data structures (Bloom filters) for efficient document verification.

## 🏗️ Architecture

\`\`\`
blockchain-memo-demo/
├── backend/                 # FastAPI backend
│   ├── app.py              # Main FastAPI application
│   ├── blockchain.py       # Blockchain simulator logic
│   ├── bloom.py            # Bloom filter utilities
│   ├── students.csv        # Dummy student dataset
│   ├── files/              # Uploaded memos storage
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container config
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main app with routing
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Verify.jsx
│   │   │   └── Students.jsx
│   │   └── components/     # Reusable components
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml      # Multi-container orchestration
└── README.md              # This file
\`\`\`

## 🚀 Features

### Backend (FastAPI)
- **File Upload**: Accept PDF/image files with SHA-256 hash generation
- **Blockchain Simulation**: Simple linked JSON blocks for immutable storage
- **Bloom Filter**: Probabilistic data structure for efficient existence checks
- **Student Lookup**: Query dummy student dataset
- **RESTful API**: Clean endpoints for all operations

### Frontend (React + Vite)
- **Dashboard**: Real-time blockchain statistics and system overview
- **Upload Page**: Drag-and-drop file upload with progress feedback
- **Verification Page**: Hash lookup with detailed block information
- **Student Lookup**: Search student records by ID
- **Responsive Design**: TailwindCSS for modern, mobile-first UI

### Blockchain Features
- **Immutable Ledger**: Each block contains transactions with file hashes
- **Chain Validation**: Cryptographic linking between blocks
- **Transaction History**: Complete audit trail of all uploads
- **Real-time Stats**: Block count, transaction count, latest block info

## 🛠️ Tech Stack

- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Frontend**: React 18, Vite, TailwindCSS, Axios, React Router
- **Blockchain**: Custom Python implementation with SHA-256 hashing
- **Storage**: Local filesystem (simulates off-chain storage)
- **Deployment**: Docker & Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone and navigate to the project**:
   \`\`\`bash
   git clone <repository-url>
   cd blockchain-memo-demo
   \`\`\`

2. **Start all services**:
   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
\`\`\`

#### Frontend Setup
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 📖 API Documentation

### Endpoints

#### `POST /upload_memo`
Upload a PDF or image file to the blockchain.

**Request**: Multipart form data with file
**Response**:
\`\`\`json
{
  "status": "success",
  "message": "File uploaded and added to blockchain",
  "hash": "abc123...",
  "block_index": 1,
  "filename": "document.pdf"
}
\`\`\`

#### `GET /verify/{hash}`
Verify if a hash exists in the blockchain.

**Response**:
\`\`\`json
{
  "exists": true,
  "block_index": 1,
  "block": {
    "index": 1,
    "timestamp": "2024-01-01T12:00:00",
    "transactions": [...],
    "previous_hash": "...",
    "block_hash": "..."
  }
}
\`\`\`

#### `GET /students/{id}`
Get student information by ID.

**Response**:
\`\`\`json
{
  "found": true,
  "student": {
    "name": "Ahmed Hassan",
    "national_id": "12345678901",
    "college": "Engineering"
  }
}
\`\`\`

#### `GET /blockchain/stats`
Get blockchain statistics.

**Response**:
\`\`\`json
{
  "total_blocks": 5,
  "total_transactions": 4,
  "latest_block": {...}
}
\`\`\`

## 🧪 Testing the System

### 1. Upload a Document
1. Go to the Upload page
2. Drag and drop a PDF or image file
3. Click "Upload to Blockchain"
4. Note the generated hash

### 2. Verify the Document
1. Go to the Verify page
2. Enter the hash from step 1
3. Click "Verify"
4. View the block details

### 3. Student Lookup
1. Go to the Students page
2. Enter a student ID (1-15)
3. View student information

## 🔧 Configuration

### Environment Variables

#### Backend
- `PYTHONUNBUFFERED=1`: Ensure Python output is not buffered

#### Frontend
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

### File Storage
- Uploaded files are stored in `backend/files/`
- File names are the SHA-256 hash + original extension
- Volume mounted in Docker for persistence

## 🏗️ System Design

### Blockchain Implementation
\`\`\`python
# Block structure
{
  "index": 1,
  "timestamp": "2024-01-01T12:00:00",
  "transactions": [
    {
      "hash": "abc123...",
      "verified": true,
      "filename": "document.pdf",
      "timestamp": "2024-01-01T12:00:00"
    }
  ],
  "previous_hash": "xyz789...",
  "block_hash": "def456..."
}
\`\`\`

### Bloom Filter
- Simple implementation for prototype
- Tracks added items for accuracy
- Configurable size and hash count
- Prevents false negatives

### Security Considerations
- SHA-256 hashing for file integrity
- Immutable blockchain structure
- Input validation and sanitization
- CORS configuration for frontend access

## 🚧 Limitations (Prototype)

- **In-memory storage**: Data lost on restart
- **Single node**: No distributed consensus
- **Simplified Bloom filter**: Uses set for accuracy
- **No authentication**: Open access to all endpoints
- **Local file storage**: Not suitable for production

## 🔮 Future Enhancements

- **Persistent storage**: Database integration
- **User authentication**: JWT-based auth system
- **Distributed blockchain**: Multi-node consensus
- **Advanced Bloom filters**: True probabilistic implementation
- **Cloud storage**: S3/IPFS integration
- **API rate limiting**: Prevent abuse
- **Audit logging**: Comprehensive activity logs

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **File upload fails**: Check file size and type restrictions
3. **CORS errors**: Verify frontend/backend URLs match
4. **Docker build fails**: Ensure Docker has sufficient resources

### Logs
\`\`\`bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
\`\`\`

## 📄 License

This is a prototype/demo project for educational purposes.

## 🤝 Contributing

This is a proof-of-concept project. For production use, consider the limitations and implement proper security measures.
