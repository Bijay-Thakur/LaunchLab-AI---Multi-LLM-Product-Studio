"""OpenAI provider. Used for blueprint, Claude prompt, brand, visual prompts."""

import os
from typing import Optional

from utils.json_helpers import parse_json
from prompts.openai_prompts import (
    blueprint_prompt,
    claude_build_prompt,
    brand_campaign_prompt,
    visual_prompts,
)


class ProviderUnavailable(Exception):
    pass


class OpenAIService:
    def __init__(self) -> None:
        self._client = None
        self._model_name = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        self._api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self._timeout_s = float(os.environ.get("OPENAI_TIMEOUT", "45"))

    def available(self) -> bool:
        return bool(self._api_key)

    def _ensure_client(self):
        if self._client is not None:
            return self._client
        if not self.available():
            raise ProviderUnavailable("OPENAI_API_KEY missing")
        try:
            from openai import OpenAI  # type: ignore
        except ImportError as exc:
            raise ProviderUnavailable(f"openai package not installed: {exc}")
        self._client = OpenAI(api_key=self._api_key, timeout=self._timeout_s)
        return self._client

    def _chat(self, system: str, user: str, json_mode: bool = False) -> str:
        client = self._ensure_client()
        kwargs = {
            "model": self._model_name,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.7,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        resp = client.chat.completions.create(**kwargs)
        return (resp.choices[0].message.content or "").strip()

    def blueprint(self, raw_idea: str, research: dict) -> Optional[dict]:
        out = self._chat(
            system="You return strict JSON only. No prose, no markdown.",
            user=blueprint_prompt(raw_idea, research),
            json_mode=True,
        )
        return parse_json(out)

    def claude_prompt(self, blueprint: dict, research: dict) -> Optional[str]:
        out = self._chat(
            system="You write a single ready-to-paste plain-text prompt. No JSON, no markdown fences.",
            user=claude_build_prompt(blueprint, research),
        )
        return out or None

    def brand_campaign(self, blueprint: dict, research: dict) -> Optional[dict]:
        out = self._chat(
            system="You return strict JSON only. No prose, no markdown.",
            user=brand_campaign_prompt(blueprint, research),
            json_mode=True,
        )
        return parse_json(out)

    def visual_prompts(self, blueprint: dict, brand_campaign: dict) -> Optional[dict]:
        out = self._chat(
            system="You return strict JSON only. No prose, no markdown.",
            user=visual_prompts(blueprint, brand_campaign),
            json_mode=True,
        )
        return parse_json(out)


openai_service = OpenAIService()
