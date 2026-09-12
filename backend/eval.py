"""
Quick evaluation script for the Contract Analysis AI /ask endpoint.

HOW TO USE:
1. Make sure your backend is running (python main.py) so /ask is live at
   http://localhost:8000
2. Upload the SAME NDA template PDF you tested with through the frontend
   first (contract_store needs to be populated before /ask works).
3. Run: python eval.py
4. It will print each question, the model's answer, the time taken, and
   a final summary. Compare the model's answer to the expected one below
   and judge correct / partial / wrong yourself.

This is a lightweight, honest eval — not a full CUAD benchmark — but it
gives you real numbers instead of guessing.
"""

import requests
import time

BASE_URL = "http://localhost:8000"

# ---- Filled in based on the blank NDA template (Disclosing/Receiving Party) ----
TEST_CASES = [
    {
        "question": "What are the payment terms?",
        "expected_answer": "Not present in this contract — it's an NDA, no payment or compensation clause exists at all.",
    },
    {
        "question": "What is the governing law?",
        "expected_answer": "Left as a blank placeholder — governed by the laws of [STATE/COUNTRY], not a real jurisdiction.",
    },
    {
        "question": "What are the termination conditions?",
        "expected_answer": "No explicit termination clause. The confidentiality term runs from the Effective Date until [END DATE], and continues 'any time thereafter'.",
    },
    {
        "question": "Who are the parties involved?",
        "expected_answer": "A 'Disclosing Party' and a 'Receiving Party' — both names and addresses are blank placeholders in this template.",
    },
    {
        "question": "What are the confidentiality terms?",
        "expected_answer": "The Receiving Party cannot disclose, copy, clone, or modify confidential information without consent, and must return all confidential information once the agreement ends.",
    },
    {
        "question": "Are there any penalty clauses?",
        "expected_answer": "No specific penalty or damages clause. Only a breach-notification obligation — the Receiving Party must notify the Disclosing Party of a breach and help regain the confidential information.",
    },
    # Extra tricky ones to test hallucination specifically
    {
        "question": "What is the payment amount specified in this contract?",
        "expected_answer": "There is no payment amount — this question has no valid answer in the document, a good model should say so rather than inventing a figure.",
    },
    {
        "question": "How long does the confidentiality obligation last?",
        "expected_answer": "From the Effective Date until [END DATE] (a blank placeholder in this template), and continues indefinitely after that ('any time thereafter').",
    },
]


def check_contract_uploaded():
    """Reminds you to upload a contract first — /ask needs contract_store populated."""
    print("Make sure you've already uploaded the NDA template PDF via the frontend")
    print("(or POST to /upload) before running this — /ask needs a contract")
    print("loaded in memory first.\n")


def run_eval():
    results = []

    for i, case in enumerate(TEST_CASES, 1):
        question = case["question"]
        expected = case["expected_answer"]

        start = time.time()
        try:
            resp = requests.post(
                f"{BASE_URL}/ask",
                data={"question": question},
                timeout=60,
            )
            elapsed = time.time() - start
            data = resp.json()
            answer = data.get("answer", "<no answer field in response>")
            error = data.get("error")
        except Exception as e:
            elapsed = time.time() - start
            answer = None
            error = str(e)

        results.append({
            "question": question,
            "expected": expected,
            "answer": answer,
            "error": error,
            "latency": elapsed,
        })

        print(f"--- Q{i}: {question} ---")
        print(f"Expected : {expected}")
        print(f"Model    : {answer if not error else f'ERROR: {error}'}")
        print(f"Latency  : {elapsed:.2f}s")
        print()

    # ---- Summary ----
    total = len(results)
    errored = sum(1 for r in results if r["error"])
    avg_latency = sum(r["latency"] for r in results) / total if total else 0

    print("=" * 50)
    print(f"Total questions : {total}")
    print(f"Errored requests: {errored}")
    print(f"Avg latency     : {avg_latency:.2f}s")
    print("=" * 50)
    print()
    print("Now go through the printed answers above and manually judge each")
    print("as correct / partially correct / wrong. Pay special attention to")
    print("Q1 and Q7 (payment terms) — the correct behavior is admitting the")
    print("info isn't there, NOT making up a number. If the model invents a")
    print("payment figure, that's a hallucination — worth mentioning as a")
    print("real limitation you observed in the interview.")
    print()
    print("Report something like:")
    print('  "Tested on N questions on a sample NDA, X/N fully correct,')
    print('   avg latency Ys, and noted it correctly avoided answering')
    print('   questions with no basis in the document (or: it hallucinated')
    print('   on N of them)" — that\'s a real, defensible, and honest result.')


if __name__ == "__main__":
    check_contract_uploaded()
    run_eval()