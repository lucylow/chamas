"""
Lightweight Swahili-first LLM service.

The default implementation loads a huggingface causal model, but the service
can also proxy requests to an OpenAI-compatible endpoint by supplying a base
URL and API key through the environment. This keeps the code flexible for the
hackathon while ensuring the interface remains stable for the frontend.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict, Optional

try:
    import torch  # type: ignore
    from transformers import AutoModelForCausalLM, AutoTokenizer  # type: ignore
except Exception:  # pragma: no cover - transformers optional
    torch = None
    AutoModelForCausalLM = None
    AutoTokenizer = None

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover - openai optional
    OpenAI = None


DEFAULT_SYSTEM_PROMPT = (
    "Wewe ni Sauti Chama, msaidizi wa kidigital kwa vikundi vya akiba. "
    "Tumia Kiswahili sanifu isipokuwa mtumiaji anapotumia Sheng. "
    "Toa majibu mafupi, yenye hatua wazi na yanayowasaidia wanachama kuelewa fedha zao."
)


@dataclass
class GenerationConfig:
    max_new_tokens: int = 180
    temperature: float = 0.7
    top_p: float = 0.9


class LLMService:
    def __init__(
        self,
        model_id: str | None = None,
        system_prompt: str = DEFAULT_SYSTEM_PROMPT,
        generation: Optional[GenerationConfig] = None,
    ) -> None:
        self._system_prompt = system_prompt
        self._generation = generation or GenerationConfig()

        self._hf_model = None
        self._hf_tokenizer = None
        self._client = None
        self._model_id = model_id or os.getenv("CHAMAS_LLM_MODEL", "meta-llama/Llama-3.1-8B-Instruct")

        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL")

        if api_key and OpenAI is not None:
            self._client = OpenAI(api_key=api_key, base_url=base_url or None)  # type: ignore[arg-type]

        if self._client is None and AutoTokenizer is not None and AutoModelForCausalLM is not None:
            try:
                kwargs: Dict[str, object] = {}
                if torch is not None:
                    kwargs["torch_dtype"] = torch.float16 if torch.cuda.is_available() else torch.float32  # type: ignore[union-attr]
                    if torch.cuda.is_available():
                        kwargs["device_map"] = "auto"  # type: ignore[assignment]

                self._hf_tokenizer = AutoTokenizer.from_pretrained(self._model_id)
                self._hf_model = AutoModelForCausalLM.from_pretrained(self._model_id, **kwargs)
                self._hf_model.eval()
            except Exception:
                # Model not available (gated, network issue, etc.) - will use fallback
                self._hf_tokenizer = None
                self._hf_model = None

    @property
    def is_ready(self) -> bool:
        return bool(self._client or self._hf_model)

    def generate(
        self,
        user_text: str,
        context: str = "",
        dialect: str = "kiswahili_sanifu",
    ) -> str:
        prompt = self._build_prompt(user_text=user_text, context=context, dialect=dialect)

        if self._client is not None:
            return self._generate_via_client(prompt)

        if self._hf_model is not None and self._hf_tokenizer is not None:
            return self._generate_locally(prompt)

        return self._fallback_response(user_text=user_text)

    def _build_prompt(self, user_text: str, context: str, dialect: str) -> str:
        dialect_instruction = {
            "sheng": "Tumia Sheng safi na maneno ya vijana, lakini baki na ujumbe wa kifedha.",
            "kiamu": "Tumia Kiswahili sanifu kilicho rahisi kueleweka na maneno ya pwani inapohitajika.",
            "kiswahili_sanifu": "Tumia Kiswahili fasaha kinachofaa kwa mazungumzo ya kifedha.",
        }.get(dialect, "Tumia Kiswahili fasaha.")

        pieces = [
            self._system_prompt,
            dialect_instruction,
        ]

        if context:
            pieces.append(f"Historia fupi ya mazungumzo:\n{context}")

        pieces.append(f"Swali la mtumiaji: {user_text}")
        pieces.append("Toa jibu linaloeleweka na hatua zinazofuatwa.")

        return "\n\n".join(pieces)

    def _generate_via_client(self, prompt: str) -> str:
        assert self._client is not None  # for type-checkers

        completion = self._client.responses.create(  # type: ignore[attr-defined]
            model=self._model_id,
            input=prompt,
            temperature=self._generation.temperature,
            top_p=self._generation.top_p,
            max_output_tokens=self._generation.max_new_tokens,
        )

        first_text = ""
        for part in completion.output:  # type: ignore[attr-defined]
            if getattr(part, "type", "") == "message":
                for content in getattr(part, "content", []):
                    value = getattr(content, "text", None)
                    if value:
                        first_text += value
        return first_text.strip() or self._fallback_response(user_text=prompt)

    def _generate_locally(self, prompt: str) -> str:
        assert self._hf_model is not None and self._hf_tokenizer is not None

        inputs = self._hf_tokenizer(prompt, return_tensors="pt")

        if torch is not None and torch.cuda.is_available():  # type: ignore[union-attr]
            inputs = {key: tensor.to("cuda") for key, tensor in inputs.items()}

        with torch.no_grad():  # type: ignore[union-attr]
            output = self._hf_model.generate(
                **inputs,
                max_new_tokens=self._generation.max_new_tokens,
                do_sample=True,
                temperature=self._generation.temperature,
                top_p=self._generation.top_p,
                pad_token_id=self._hf_tokenizer.eos_token_id,
            )

        text = self._hf_tokenizer.decode(output[0], skip_special_tokens=True)
        if "Swali la mtumiaji" in text:
            text = text.split("Swali la mtumiaji")[-1]
        return text.strip()

    @staticmethod
    def _fallback_response(user_text: str) -> str:
        if not user_text.strip():
            return "Samahani, sikupata swali lako. Tafadhali rudia tena."
        return (
            "Samahani, mfumo wa akili bandia haupo tayari kwa sasa. "
            "Tafadhali jaribu tena baada ya muda mfupi."
        )




