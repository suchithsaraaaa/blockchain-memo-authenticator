import os
import json
import hashlib
from typing import Set, Optional


class BloomFilterManager:
    """Simple Bloom filter manager with persistence for prototype"""

    def __init__(self, size: int = 10000, hash_count: int = 3, storage_path: Optional[str] = None):
        self.size = size
        self.hash_count = hash_count
        self.bit_array = [False] * size
        self.added_items: Set[str] = set()  # Track actual items for prototype accuracy
        self.storage_path = storage_path
        if self.storage_path and os.path.exists(self.storage_path):
            self._load()
        else:
            self._save()

    def _hash(self, item: str, seed: int) -> int:
        """Generate hash for an item with a seed"""
        hash_input = f"{item}{seed}".encode("utf-8")
        return int(hashlib.md5(hash_input).hexdigest(), 16) % self.size

    def add(self, item: str):
        """Add an item to the bloom filter"""
        self.added_items.add(item)  # For prototype verification
        for i in range(self.hash_count):
            index = self._hash(item, i)
            self.bit_array[index] = True
        self._save()

    def might_exist(self, item: str) -> bool:
        """Check if an item might exist in the bloom filter"""
        # For prototype, use actual set for accuracy
        return item in self.added_items

    def get_stats(self) -> dict:
        """Get bloom filter statistics"""
        set_bits = sum(self.bit_array)
        return {
            "size": self.size,
            "hash_count": self.hash_count,
            "set_bits": set_bits,
            "load_factor": set_bits / self.size,
            "items_added": len(self.added_items),
        }

    def _save(self):
        if not self.storage_path:
            return
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump({
                "size": self.size,
                "hash_count": self.hash_count,
                "added_items": list(self.added_items),
            }, f, ensure_ascii=False, indent=2)

    def _load(self):
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.size = data.get("size", self.size)
            self.hash_count = data.get("hash_count", self.hash_count)
            self.added_items = set(data.get("added_items", []))
            # rebuild bit array
            self.bit_array = [False] * self.size
            for item in self.added_items:
                for i in range(self.hash_count):
                    index = self._hash(item, i)
                    self.bit_array[index] = True
        except Exception:
            # Start fresh if load fails
            self.bit_array = [False] * self.size
            self.added_items = set()
            self._save()