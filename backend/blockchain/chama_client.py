"""
Thin abstraction over etherscan-compatible JSON-RPC calls for interacting with
the ChamaFactory contract. For the hackathon we keep things simple and only
expose the read paths required by the voice assistant.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, Optional

from web3 import AsyncHTTPProvider, AsyncWeb3
from web3.contract.async_contract import AsyncContract


DEFAULT_FACTORY_ABI = [
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
    contribution: Decimal
    members: int
    active: bool


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

        raw_contribution = Decimal(result["contributionAmount"]) if "contributionAmount" in result else Decimal("0")
        return ChamaSummary(
            id=int(result.get("id", chama_id)),
            name=str(result.get("name", "")),
            contribution=self._from_wei(raw_contribution),
            members=int(result.get("memberCount", 0)),
            active=bool(result.get("active", False)),
        )

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
        # Convert from wei to ether and quantize for readability
        return (amount / Decimal("1e18")).quantize(Decimal("0.0001"))


