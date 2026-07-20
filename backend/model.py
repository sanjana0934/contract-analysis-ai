import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), "tinyllama_lora_v2")
BASE_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

model = None
tokenizer = None

def load_model():
    global model, tokenizer
    if model is not None:
        return model, tokenizer

    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    tokenizer.pad_token = tokenizer.eos_token

    print("Loading base model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto",
        dtype=torch.float32
    )

    print("Loading LoRA adapter...")
    model = PeftModel.from_pretrained(base_model, MODEL_DIR)
    model.eval()

    print("Model ready!")
    return model, tokenizer

def ask_model(context: str, question: str, max_new_tokens: int = 150) -> str:
    m, tok = load_model()

    prompt = f"""### Context:
{context}

### Question:
{question}

### Answer:
"""
    inputs = tok(prompt, return_tensors="pt", truncation=True, max_length=1024)

    with torch.no_grad():
        outputs = m.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tok.eos_token_id
        )

    response = tok.decode(outputs[0], skip_special_tokens=True)
    return response.split("### Answer:")[-1].strip()