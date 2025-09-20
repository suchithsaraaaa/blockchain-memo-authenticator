import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

class Block:
    def __init__(self, index: int, transactions: List[Dict[str, Any]], previous_hash: str):
        self.index = index
        self.timestamp = datetime.now().isoformat()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.block_hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of the block"""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert block to dictionary"""
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "block_hash": self.block_hash
        }

class Blockchain:
    def __init__(self):
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict[str, Any]] = []
        self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block in the blockchain"""
        genesis_block = Block(0, [], "0")
        self.chain.append(genesis_block)
    
    def get_latest_block(self) -> Dict[str, Any]:
        """Get the latest block in the chain"""
        return self.chain[-1].to_dict()
    
    def add_transaction(self, transaction: Dict[str, Any]) -> int:
        """Add a transaction and create a new block"""
        # For this prototype, we create a new block for each transaction
        # In a real blockchain, you'd batch transactions
        new_block = Block(
            index=len(self.chain),
            transactions=[transaction],
            previous_hash=self.chain[-1].block_hash
        )
        
        self.chain.append(new_block)
        return new_block.index
    
    def find_hash(self, target_hash: str) -> Optional[int]:
        """Find a hash in the blockchain and return block index"""
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.get("hash") == target_hash:
                    return block.index
        return None
    
    def get_block(self, index: int) -> Optional[Dict[str, Any]]:
        """Get a specific block by index"""
        if 0 <= index < len(self.chain):
            return self.chain[index].to_dict()
        return None
    
    def get_total_transactions(self) -> int:
        """Get total number of transactions across all blocks"""
        total = 0
        for block in self.chain:
            total += len(block.transactions)
        return total
    
    def validate_chain(self) -> bool:
        """Validate the entire blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check if current block's hash is valid
            if current_block.block_hash != current_block.calculate_hash():
                return False
            
            # Check if current block points to previous block
            if current_block.previous_hash != previous_block.block_hash:
                return False
        
        return True
    
    def get_transactions_by_hash(self, target_hash: str) -> List[Dict[str, Any]]:
        """Get all transactions containing a specific hash"""
        transactions = []
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.get("hash") == target_hash:
                    transactions.append({
                        "block_index": block.index,
                        "transaction": transaction,
                        "block_timestamp": block.timestamp
                    })
        return transactions
