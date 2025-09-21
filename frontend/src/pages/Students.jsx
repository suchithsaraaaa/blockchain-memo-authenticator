"use client"

import { useState } from "react"
import { Search, User, GraduationCap, Award as IdCard, AlertCircle } from "lucide-react"
import axios from "axios"
import { Hash, Database, Download } from "lucide-react"

const Students = () => {
  const [studentId, setStudentId] = useState("")
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!studentId.trim()) {
      setError("Please enter a student ID")
      return
    }

    try {
      setSearching(true)
      setError("")

      const response = await axios.get(`/api/students/${studentId.trim()}`)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Search failed")
      console.error("Search error:", err)
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const resetForm = () => {
    setStudentId("")
    setResult(null)
    setError("")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Student Lookup</h1>
        <p className="text-gray-600">Search for student information using their ID</p>
      </div>

      <div className="card space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Student ID</label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter student ID (e.g., 1, 2, 3...)"
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !studentId.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-error flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* CSV student details */}
            {result.found ? (
              <div className="space-y-4">
                <div className="alert-success flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Student Found!</span>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{result.student.name}</h3>
                      <p className="text-sm text-gray-600">Student ID: {studentId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <IdCard className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">National ID</p>
                        <p className="text-sm text-gray-900 font-mono">{result.student.national_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                      <GraduationCap className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">College</p>
                        <p className="text-sm text-gray-900">{result.student.college}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="alert-warning flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Student not found in CSV records.</span>
                </div>
                {result.memo?.exists && result.memo.transaction && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{result.memo.transaction.student_name}</h3>
                        <p className="text-sm text-gray-600">Student ID: {studentId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <GraduationCap className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">College</p>
                          <p className="text-sm text-gray-900">{result.memo.transaction.college}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blockchain presence */}
            <div className="mt-2 space-y-3">
              <div className={`flex items-center space-x-2 ${result.memo?.exists ? "alert-success" : "alert-error"}`}>
                <Database className="h-4 w-4" />
                <span className="font-medium">
                  {result.memo?.exists ? "Memo present in blockchain" : "No memo found in blockchain for this student ID"}
                </span>
              </div>

              {result.memo?.exists && (
                <div className="bg-white rounded-lg border p-3 text-sm space-y-1">
                  <div><span className="font-medium">Hash:</span> <span className="font-mono break-all">{result.memo.hash}</span></div>
                  <div><span className="font-medium">Block Index:</span> <span className="font-mono">{result.memo.block_index}</span></div>
                  {result.memo.transaction && (
                    <>
                      <div><span className="font-medium">Student Name:</span> {result.memo.transaction.student_name}</div>
                      <div><span className="font-medium">College:</span> {result.memo.transaction.college}</div>
                      {typeof result.memo.transaction.verified !== 'undefined' && (
                        <div><span className="font-medium">Verified:</span> {String(result.memo.transaction.verified)}</div>
                      )}
                      {result.memo.transaction.uploader && (
                        <div><span className="font-medium">Uploaded By:</span> {result.memo.transaction.uploader}</div>
                      )}
                      {result.memo.transaction.original_filename && (
                        <div><span className="font-medium">Original Filename:</span> {result.memo.transaction.original_filename}</div>
                      )}
                      {result.memo.transaction.tx_timestamp && (
                        <div><span className="font-medium">Timestamp:</span> {result.memo.transaction.tx_timestamp}</div>
                      )}
                    </>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <a
                      href={`/api/students/${studentId}/memo/download`}
                      className="btn-secondary inline-flex items-center space-x-2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Memo</span>
                    </a>
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Database className="h-4 w-4" />
                      <a href="/export/blockchain.json" className="link-primary" target="_blank" rel="noreferrer">View Blockchain JSON</a>
                    </div>
                  </div>
                </div>
              )}

              {result.match && (
                <div className="bg-white rounded-lg border p-3 text-sm">
                  <div className="font-medium text-gray-700 mb-2">CSV vs. Memo Comparison</div>
                  <ul className="space-y-1">
                    <li className={result.match.student_name?.status === 'match' ? 'text-green-700' : 'text-yellow-700'}>
                      Student Name: expected {String(result.match.student_name?.expected || '-')}, provided {String(result.match.student_name?.provided || '-')}
                    </li>
                    <li className={result.match.college?.status === 'match' ? 'text-green-700' : 'text-yellow-700'}>
                      College: expected {String(result.match.college?.expected || '-')}, provided {String(result.match.college?.provided || '-')}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button onClick={resetForm} className="btn-secondary">
                Search Another Student
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Students</h2>
        <p className="text-sm text-gray-600 mb-3">
          This is a demo with sample student data. Try searching for IDs 1-15:
        </p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((id) => (
            <button
              key={id}
              onClick={() => setStudentId(id.toString())}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Students
