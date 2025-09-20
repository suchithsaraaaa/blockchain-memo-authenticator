"use client"

import { useState } from "react"
import { UploadIcon, FileText, AlertCircle, CheckCircle, Hash } from "lucide-react"
import axios from "axios"

const Upload = () => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    setResult(null)
    setError("")
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    setFile(droppedFile)
    setResult(null)
    setError("")
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploading(true)
      setError("")

      const response = await axios.post("/api/upload_memo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed")
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setResult(null)
    setError("")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Memo</h1>
        <p className="text-gray-600">Upload a PDF or image file to authenticate it on the blockchain</p>
      </div>

      <div className="card">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? "border-success-300 bg-success-50" : "border-gray-300 hover:border-primary-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {file ? (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-success-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button onClick={resetForm} className="text-sm text-primary-600 hover:text-primary-700">
                Choose different file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your file here, or{" "}
                  <label className="text-primary-600 hover:text-primary-700 cursor-pointer">
                    browse
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                  </label>
                </p>
                <p className="text-sm text-gray-600">PDF and image files only</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="alert-error flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {file && !result && (
          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  <span>Upload to Blockchain</span>
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div
              className={`flex items-center space-x-2 ${
                result.status === "success" ? "alert-success" : "alert-warning"
              }`}
            >
              {result.status === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{result.message}</span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">File Hash:</span>
              </div>
              <p className="text-sm font-mono bg-white p-2 rounded border break-all">{result.hash}</p>

              {result.block_index !== undefined && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Block Index: </span>
                  <span className="text-sm font-mono">{result.block_index}</span>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button onClick={resetForm} className="btn-secondary">
                Upload Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Upload
