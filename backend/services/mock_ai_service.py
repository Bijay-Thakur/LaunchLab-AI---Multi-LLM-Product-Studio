"""Mock AI service layer.

This is the seam where real LLM calls (Gemini, OpenAI, Claude, image APIs) will plug in later.
For v1 every method returns deterministic mock content from data/mock_outputs.py.
"""

from data import mock_outputs


class MockAIService:
    def generate_package(self, raw_idea: str) -> dict:
        idea = (raw_idea or "").strip()
        if not idea:
            raise ValueError("rawIdea must not be empty")
        return mock_outputs.build_full_package(idea)

    def sample_package(self) -> dict:
        return mock_outputs.build_sample_package()

    def research(self, raw_idea: str) -> dict:
        return mock_outputs.build_research(raw_idea)

    def blueprint(self, raw_idea: str) -> dict:
        return mock_outputs.build_blueprint(raw_idea)

    def claude_prompt(self, raw_idea: str) -> str:
        return mock_outputs.build_claude_prompt(raw_idea)

    def brand_campaign(self, raw_idea: str) -> dict:
        return mock_outputs.build_brand_campaign(raw_idea)

    def visual_prompts(self, raw_idea: str) -> dict:
        return mock_outputs.build_visual_prompts(raw_idea)

    def evaluation(self, raw_idea: str) -> dict:
        return mock_outputs.build_evaluation(raw_idea)


service = MockAIService()
