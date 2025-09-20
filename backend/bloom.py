import hashlib
from typing import Set

class BloomFilterManager:
    """Simple Bloom filter implementation for prototype"""
    
    def __init__(self, size: int = 10000, hash_count: int = 3):
        self.size = size
        self.hash_count = hash_count
        self.bit_array = [False] * size
        self.added_items: Set[str] = set()  # For prototype - track actual items
    
    def _hash(self, item: str, seed: int) -> int:
        """Generate hash for an item with a seed"""
        hash_input = f"{item}{seed}".encode('utf-8')
        return int(hashlib.md5(hash_input).hexdigest(), 16) % self.size
    
    def add(self, item: str):
        """Add an item to the bloom filter"""
        self.added_items.add(item)  # For prototype verification
        
        for i in range(self.hash_count):
            index = self._hash(item, i)
            self.bit_array[index] = True
    
    def might_exist(self, item: str) -> bool:
        """Check if an item might exist in the bloom filter"""
        # For prototype, use actual set for accuracy
        return item in self.added_items
        
        # Real bloom filter implementation (commented for prototype):
        # for i in range(self.hash_count):
        #     index = self._hash(item, i)
        #     if not self.bit_array[index]:
        #         return False
        # return True
    
    def get_stats(self) -> dict:
        """Get bloom filter statistics"""
        set_bits = sum(self.bit_array)
        return {
            "size": self.size,
            "hash_count": self.hash_count,
            "set_bits": set_bits,
            "load_factor": set_bits / self.size,
            "items_added": len(self.added_items)
        }
