"use client"

import { useState } from "react"
import { Search, Hash, CheckCircle, XCircle, Database, Upload } from "lucide-react"
import { api } from "../lib/api"

async function sha256Hex(file) {
  const buf = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

const Verify = () => {
  const [hash, setHash] = useState("")
  const [file, setFile] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [college, setCollege] = useState("")

  const handleVerify = async () => {
    const hasHashOrFile = !!(hash.trim() || file)
    const hasFullStudentDetails = !!(studentId && studentName && college)
    const hasStudentIdOnly = !!studentId
    if (!hasHashOrFile && !hasFullStudentDetails && !hasStudentIdOnly) {
      setError("Provide a hash/file, student ID, or full student details (ID, Name, College)")
      return
    }

    try {
      setVerifying(true)
      setError("")

      const form = new FormData()
      if (file) form.append("file", file)
      if (!file && hash.trim()) form.append("manual_hash", hash.trim())
      if (studentId) form.append("student_id", studentId)
      if (studentName) form.append("student_name", studentName)
      if (college) form.append("college", college)

      const { data } = await api.post(`/verify`, form)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed")
      console.error("Verification error:", err)
    } finally {
      setVerifying(false)
    }
  }

  const handleFileChange = async (e) => {
    const f = e.target.files[0]
    setFile(f)
    setError("")
    setResult(null)
    if (f) {
      const h = await sha256Hex(f)
      setHash(h)
    }
  }

  const resetForm = () => {
    setHash("")
    setFile(null)
    setResult(null)
    setError("")
    setStudentId("")
    setCollege("")
    setStudentName("")
  }

  const colorClass = (status) => (status === "match" ? "text-green-700" : status === "mismatch" ? "text-yellow-700" : "text-gray-600")

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Memo</h1>
        <p className="text-gray-600">Enter a hash or upload a file. Hash is auto-computed for uploads.</p>
      </div>

      <div className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">File (optional)</label>
            <div className="flex items-center gap-2">
              <input type="file" accept=".pdf,image/*" onChange={handleFileChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Student ID</label>
            <input className="w-full border rounded px-3 py-2" value={studentId} onChange={(e)=>setStudentId(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Student Name</label>
            <input className="w-full border rounded px-3 py-2" value={studentName} onChange={(e)=>setStudentName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">College</label>
            <input className="w-full border rounded px-3 py-2" value={college} onChange={(e)=>setCollege(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">File Hash (SHA-256)</label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Enter SHA-256 hash (64 characters)"
                  className="input-field pl-10"
                  maxLength={64}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={verifying || (!hash.trim() && !file && !studentId && !(studentId && studentName && college))}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">Upload a file to auto-compute its hash client-side.</p>
          </div>
        </div>

        {error && (
          <div className="alert-error flex items-center space-x-2">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`flex items-center space-x-2 ${result.status_color === "green" ? "alert-success" : result.status_color === "yellow" ? "alert-warning" : "alert-error"}`}>
              {result.exists ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <span className="font-medium">{result.message}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm">
                <div><span className="font-medium">Hash:</span> <span className="font-mono break-all">{result.hash}</span></div>
                {result.block_index !== undefined && (
                  <div><span className="font-medium">Block Index:</span> <span className="font-mono">{result.block_index}</span></div>
                )}
              </div>

              {result.match && (
                <div className="mt-2">
                  <div className="font-medium text-gray-700 mb-1">Field comparison:</div>
                  <ul className="text-sm space-y-1">
                    {result.match.student_id && (
                      <li className={colorClass(result.match.student_id?.status)}>
                        Student ID: expected {String(result.match.student_id?.expected || "-")}, provided {String(result.match.student_id?.provided || "-")} ({result.match.student_id?.status})
                      </li>
                    )}
                    {result.match.student_name && (
                      <li className={colorClass(result.match.student_name?.status)}>
                        Student Name: expected {String(result.match.student_name?.expected || "-")}, provided {String(result.match.student_name?.provided || "-")} ({result.match.student_name?.status})
                      </li>
                    )}
                    {result.match.college && (
                      <li className={colorClass(result.match.college?.status)}>
                        College: expected {String(result.match.college?.expected || "-")}, provided {String(result.match.college?.provided || "-")} ({result.match.college?.status})
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {result.block && (
                <div className="mt-3">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Block Details:</span>
                  </div>
                  <div className="mt-2 bg-white rounded border p-3">
                    <pre className="text-xs text-gray-700 overflow-x-auto">{JSON.stringify(result.block, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button onClick={resetForm} className="btn-secondary">
                Verify Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Verify
