import { NextResponse } from "next/server"

// Mock blockchain data for demonstration
const mockBlockchainData = {
  total_blocks: 5,
  total_transactions: 12,
  latest_block: {
    index: 4,
    timestamp: new Date().toISOString(),
    transactions: [
      {
        hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
        verified: true,
        filename: "sample_memo.pdf",
        timestamp: new Date().toISOString(),
      },
    ],
    previous_hash: "0000abc123def456789012345678901234567890abcdef1234567890abcdef12",
    hash: "0000def456abc789012345678901234567890abcdef1234567890abcdef123456",
    nonce: 12345,
  },
}

export async function GET() {
  try {
    return NextResponse.json(mockBlockchainData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch blockchain statistics" }, { status: 500 })
  }
}
