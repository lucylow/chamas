"""
Thin abstraction over etherscan-compatible JSON-RPC calls for interacting with
the ChamaFactory contract. For the hackathon we keep things simple and only
expose the read paths required by the voice assistant.
"""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, List, Optional

from web3 import AsyncHTTPProvider, AsyncWeb3
from web3.contract.async_contract import AsyncContract


DEFAULT_FACTORY_ABI = [
    {
        "inputs": [],
        "name": "chamaCount",
        "outputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_chamaId", "type": "uint256"},
        ],
        "name": "getChamaInfo",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "id", "type": "uint256"},
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "uint256", "name": "memberCount", "type": "uint256"},
                    {"internalType": "uint256", "name": "contributionAmount", "type": "uint256"},
                    {"internalType": "uint256", "name": "contributionFrequency", "type": "uint256"},
                    {"internalType": "uint256", "name": "totalFunds", "type": "uint256"},
                    {"internalType": "bool", "name": "active", "type": "bool"},
                ],
                "internalType": "struct ChamaFactory.Chama",
                "name": "",
                "type": "tuple",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


@dataclass
class ChamaSummary:
    id: int
    name: str
    owner: str
    members: int
    contribution_wei: Decimal
    contribution_eth: Decimal
    total_funds_wei: Decimal
    total_funds_eth: Decimal
    frequency: int
    active: bool
    raw: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "owner": self.owner,
            "members": self.members,
            "active": self.active,
            "contributionWei": str(self.contribution_wei),
            "contributionEth": float(self.contribution_eth),
            "totalFundsWei": str(self.total_funds_wei),
            "totalFundsEth": float(self.total_funds_eth),
            "contributionFrequency": self.frequency,
        }


class ChamaClient:
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        factory_address: Optional[str] = None,
        factory_abi: Any = None,
    ) -> None:
        self._rpc_url = rpc_url or os.getenv("SEPOLIA_RPC_URL")
        self._factory_address = factory_address or os.getenv("CHAMA_FACTORY_ADDRESS")
        self._factory_abi = factory_abi or DEFAULT_FACTORY_ABI
        self._web3: Optional[AsyncWeb3] = None
        self._contract: Optional[AsyncContract] = None

        if self._rpc_url and self._factory_address:
            provider = AsyncHTTPProvider(self._rpc_url)
            self._web3 = AsyncWeb3(provider)
            self._contract = self._web3.eth.contract(  # type: ignore[assignment]
                address=self._factory_address,
                abi=self._factory_abi,
            )

    @property
    def is_ready(self) -> bool:
        return self._contract is not None

    async def get_chama(self, chama_id: int) -> Optional[ChamaSummary]:
        if self._contract is None:
            return None

        result: Dict[str, Any] = await self._contract.functions.getChamaInfo(chama_id).call()  # type: ignore[no-any-return]
        if not result:
            return None

        return self._build_summary(result, fallback_id=chama_id)

    async def list_chamas(self, limit: int = 6) -> List[ChamaSummary]:
        if self._contract is None:
            return []

        total = await self.get_chama_count()
        if total <= 0:
            return []

        start = max(1, total - limit + 1)
        tasks = [
            self._contract.functions.getChamaInfo(chama_id).call()
            for chama_id in range(start, total + 1)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        summaries: List[ChamaSummary] = []
        for offset, payload in enumerate(results):
            chama_id = start + offset
            if isinstance(payload, Exception) or not payload:
                continue
            summaries.append(self._build_summary(payload, fallback_id=chama_id))

        return list(reversed(summaries))

    async def get_chama_count(self) -> int:
        if self._contract is None:
            return 0
        try:
            count = await self._contract.functions.chamaCount().call()  # type: ignore[no-any-return]
            return int(count)
        except Exception:
            return 0

    async def healthcheck(self) -> bool:
        if self._web3 is None:
            return False
        try:
            await self._web3.eth.chain_id  # type: ignore[attr-defined,no-any-return]
            return True
        except Exception:
            return False

    @staticmethod
    def _from_wei(amount: Decimal) -> Decimal:
        return (amount / Decimal("1e18")).quantize(Decimal("0.0001"))

    def _build_summary(self, payload: Dict[str, Any], fallback_id: int) -> ChamaSummary:
        def _get(key: str, index: int) -> Any:
            if hasattr(payload, "get"):
                return payload.get(key)
            return payload[index]

        contribution_wei = Decimal(_get("contributionAmount", 4) or 0)
        total_funds_wei = Decimal(_get("totalFunds", 6) or 0)

        raw_dict = dict(payload.items()) if hasattr(payload, "items") else {}

        return ChamaSummary(
            id=int(_get("id", 0) or fallback_id),
            name=str(_get("name", 1) or ""),
            owner=str(_get("owner", 2) or ""),
            members=int(_get("memberCount", 3) or 0),
            contribution_wei=contribution_wei,
            contribution_eth=self._from_wei(contribution_wei),
            total_funds_wei=total_funds_wei,
            total_funds_eth=self._from_wei(total_funds_wei),
            frequency=int(_get("contributionFrequency", 5) or 0),
            active=bool(_get("active", 7) or False),
            raw=raw_dict,
        )
