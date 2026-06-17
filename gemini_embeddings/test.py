
import os
import numpy as np
from google import genai
from google.genai import types

# Initialize the client using an API key
client = genai.Client(api_key = os.getenv("GEMINI_DEV_API_KEY", ""))

content = types.Content(
    parts=[
        types.Part.from_text(
            text= "The quick brown fox jumps over the lazy dog."
        )
    ],
)

response = client.models.embed_content(
    model=os.getenv("EMBEDDINGS_MODEL", ""),
    contents=[content],
    config=types.EmbedContentConfig(output_dimensionality=128),
)

embedding_values_np = np.array(response.embeddings[0].values)

print(f"Embedding length: {len(embedding_values_np)}")
print(f"Norm of embedding: {np.linalg.norm(embedding_values_np):.6f}") # Should be very close to 1
