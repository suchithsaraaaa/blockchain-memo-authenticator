"use client"

import { useState } from "react"
import { Search, Hash, CheckCircle, XCircle, Database } from "lucide-react"
import axios from "axios"

const Verify = () => {
  const [hash, setHash] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const handleVerify = async () => {
    if (!hash.trim()) {
      setError("Please enter a hash to verify")
      return
    }

    try {
      setVerifying(true)
      setError("")

      const response = await axios.get(`/api/verify/${hash.trim()}`)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed")
      console.error("Verification error:", err)
    } finally {
      setVerifying(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleVerify()
    }
  }

  const resetForm = () => {
    setHash("")
    setResult(null)
    setError("")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Hash</h1>
        <p className="text-gray-600">Enter a file hash to verify its authenticity on the blockchain</p>
      </div>

      <div className="card space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">File Hash (SHA-256)</label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter SHA-256 hash (64 characters)"
                className="input-field pl-10"
                maxLength={64}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={verifying || !hash.trim()}
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
          <p className="text-xs text-gray-500">Hash should be exactly 64 hexadecimal characters</p>
        </div>

        {error && (
          <div className="alert-error flex items-center space-x-2">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`flex items-center space-x-2 ${result.exists ? "alert-success" : "alert-error"}`}>
              {result.exists ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <span className="font-medium">{result.exists ? "Hash Found!" : "Hash Not Found"}</span>
            </div>

            <p className="text-gray-600">{result.message}</p>

            {result.exists && result.block && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Block Details:</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Block Index:</span>
                    <p className="font-mono">{result.block.index}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Timestamp:</span>
                    <p className="font-mono text-xs">{new Date(result.block.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Previous Hash:</span>
                    <p className="font-mono text-xs break-all">{result.block.previous_hash}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Block Hash:</span>
                    <p className="font-mono text-xs break-all">{result.block.block_hash}</p>
                  </div>
                </div>

                {result.block.transactions && result.block.transactions.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Transactions:</span>
                    <div className="mt-2 bg-white rounded border p-3">
                      <pre className="text-xs text-gray-700 overflow-x-auto">
                        {JSON.stringify(result.block.transactions, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <button onClick={resetForm} className="btn-secondary">
                Verify Another Hash
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">How Verification Works</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Enter the SHA-256 hash of a document you want to verify</p>
          <p>• The system searches the blockchain for this hash</p>
          <p>• If found, the document was previously uploaded and authenticated</p>
          <p>• Block details show when and where the hash was recorded</p>
        </div>
      </div>
    </div>
  )
}

export default Verify
