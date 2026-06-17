import os
from google import genai
from google.genai import types

class GeminiClient(genai.Client):
    def __init__(self, api_key: str, dimensionality: int = 128):
        super().__init__(api_key=api_key)

        self.content = types.Content(parts=[])
        self.response = None
        self.dimensionality = dimensionality

    def add_text(self, text: str):
        part = types.Part.from_text(text=text)
        self.content.parts.append(part)

    def embed(self):
        if self.content is None or len(self.content.parts) == 0:
            raise ValueError("Content is empty. Please add content before embedding.")

        response = self.models.embed_content(
            model=os.getenv("EMBEDDINGS_MODEL", ""),
            contents=[self.content],
            config=types.EmbedContentConfig(
                output_dimensionality=self.dimensionality,
            ),
        )

        self.response = response
        return self.response

    def embed_texts(self, text_list: list[str]):
        if not text_list:
            return []

        contents = [
            types.Content(parts=[types.Part.from_text(text=text)])
            for text in text_list
        ]

        response = self.models.embed_content(
            model=os.getenv("EMBEDDINGS_MODEL", ""),
            contents=contents,
            config=types.EmbedContentConfig(
                output_dimensionality=self.dimensionality,
            ),
        )

        self.response = response
        return [embedding.values for embedding in response.embeddings]

    def add_parts(self, parts: list[types.Part]):
        for part in parts:
            if not isinstance(part, types.Part):
                raise ValueError("All items in parts must be of type types.Part")
            self.content.parts.append(part)

    def add_parts_from_text(self, text_list: list[str]):
        for text in text_list:
            part = types.Part.from_text(text=text)
            self.content.parts.append(part)
