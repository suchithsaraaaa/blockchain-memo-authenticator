"use client"

import { useState, useEffect } from "react"
import { BarChart3, Shield, FileText, Database } from "lucide-react"
import { api } from "../lib/api"
import { Link } from "react-router-dom"

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [blocksExpanded, setBlocksExpanded] = useState(false)
  const [blocks, setBlocks] = useState([])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 5000) // polling for live updates
    return () => clearInterval(id)
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/blockchain")
      setStats(data.summary)
      setBlocks(data.blocks || [])
    } catch (err) {
      setError("Failed to fetch blockchain data")
      console.error("Error fetching stats:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Blockchain Memo Authenticator</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A proof-of-concept system for memo authentication using blockchain simulation and probabilistic data
          structures for efficient document verification.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Blocks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_blocks}</p>
              </div>
              <Database className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_transactions}</p>
              </div>
              <FileText className="h-8 w-8 text-success-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Block</p>
                <p className="text-2xl font-bold text-gray-900">#{stats.latest_block?.index || 0}</p>
              </div>
              <Shield className="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Blockchain Viewer</h2>
          <button className="btn-secondary" onClick={()=>setBlocksExpanded(!blocksExpanded)}>
            {blocksExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
        {blocksExpanded && (
          <div className="mt-4 bg-gray-50 rounded p-3">
            <pre className="text-xs overflow-x-auto">{JSON.stringify(blocks, null, 2)}</pre>
          </div>
        )}
        <div className="mt-4 flex gap-2 text-sm flex-wrap">
          <a className="text-blue-700 underline hover:text-blue-900" href="/export/blockchain.json" target="_blank" rel="noreferrer">Export Blockchain JSON</a>
          <a className="text-blue-700 underline hover:text-blue-900" href="/export/students.json" target="_blank" rel="noreferrer">Export Students JSON</a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload Document</h3>
                <p className="text-sm text-gray-600">Upload PDF or image files to be authenticated</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Hash Generation</h3>
                <p className="text-sm text-gray-600">System generates SHA-256 hash of the document</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Blockchain Storage</h3>
                <p className="text-sm text-gray-600">Hash is stored in blockchain for immutable verification</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Verification</h3>
                <p className="text-sm text-gray-600">Anyone can verify document authenticity using the hash</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-success-600" />
              <span className="text-gray-700">Blockchain-based authentication</span>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-success-600" />
              <span className="text-gray-700">PDF and image file support</span>
            </div>
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-success-600" />
              <span className="text-gray-700">Bloom filter optimization</span>
            </div>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-success-600" />
              <span className="text-gray-700">Real-time statistics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
