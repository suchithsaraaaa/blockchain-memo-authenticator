import os
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional


class Block:
    def __init__(self, index: int, transactions: List[Dict[str, Any]], previous_hash: str, timestamp: Optional[str] = None, block_hash: Optional[str] = None):
        self.index = index
        self.timestamp = timestamp or datetime.now().isoformat()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.block_hash = block_hash or self.calculate_hash()

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

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Block":
        return cls(
            index=data["index"],
            transactions=data.get("transactions", []),
            previous_hash=data.get("previous_hash", "0"),
            timestamp=data.get("timestamp"),
            block_hash=data.get("block_hash"),
        )


class Blockchain:
    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path
        self.chain: List[Block] = []
        if self.storage_path and os.path.exists(self.storage_path):
            self._load()
        else:
            self.create_genesis_block()
            self._save()

    def create_genesis_block(self):
        """Create the first block in the blockchain"""
        genesis_block = Block(0, [], "0")
        self.chain = [genesis_block]

    def get_latest_block(self) -> Dict[str, Any]:
        """Get the latest block in the chain"""
        return self.chain[-1].to_dict()

    def add_transaction(self, transaction: Dict[str, Any]) -> int:
        """Add a transaction and create a new block"""
        new_block = Block(
            index=len(self.chain),
            transactions=[transaction],
            previous_hash=self.chain[-1].block_hash
        )
        self.chain.append(new_block)
        self._save()
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
        return sum(len(block.transactions) for block in self.chain)

    def validate_chain(self) -> bool:
        """Validate the entire blockchain"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            if current_block.block_hash != current_block.calculate_hash():
                return False
            if current_block.previous_hash != previous_block.block_hash:
                return False
        return True

    def get_transactions_by_hash(self, target_hash: str) -> List[Dict[str, Any]]:
        """Get all transactions containing a specific hash"""
        transactions: List[Dict[str, Any]] = []
        for block in self.chain:
            for transaction in block.transactions:
                if transaction.get("hash") == target_hash:
                    transactions.append({
                        "block_index": block.index,
                        "transaction": transaction,
                        "block_timestamp": block.timestamp
                    })
        return transactions

    def summary(self) -> Dict[str, Any]:
        return {
            "total_blocks": len(self.chain),
            "total_transactions": self.get_total_transactions(),
            "latest_block": self.get_latest_block() if self.chain else None,
            "valid": self.validate_chain(),
        }

    def _save(self):
        if not self.storage_path:
            return
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump([b.to_dict() for b in self.chain], f, ensure_ascii=False, indent=2)

    def _load(self):
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.chain = [Block.from_dict(b) for b in data]
            if not self.chain:
                self.create_genesis_block()
        except Exception:
            # Fallback to a fresh chain
            self.create_genesis_block()
            self._save()