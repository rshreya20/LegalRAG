import os
import uuid
import traceback

from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from langchain_groq import ChatGroq

from src.document_parser import parse_legal_document
from src.indexer import index_document, get_retriever
from src.summarizer import generate_summary
from src.clause_extractor import extract_clauses
from src.risk_analyzer import analyze_risks
from src.conflict_detector import detect_conflicts
from src.qa_chain import build_qa_chain, ask_question


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25 MB


ALLOWED_EXTENSIONS = {"pdf", "docx"}


# ---------------------------------------------------------------------------
# Global application state
# ---------------------------------------------------------------------------

current_qa_chain = None
current_document_name = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def get_llm():
    """
    Create the Groq LLM using the same model configuration
    as the working CLI application.
    """

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured in the .env file."
        )

    model = os.getenv(
        "GROQ_MODEL",
        "openai/gpt-oss-20b"
    )

    return ChatGroq(
        model=model,
        temperature=0,
        groq_api_key=api_key,
    )


def clean_result(value):
    """
    Convert common Python objects into JSON-safe values.
    """

    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, dict):
        return {
            str(k): clean_result(v)
            for k, v in value.items()
        }

    if isinstance(value, list):
        return [
            clean_result(item)
            for item in value
        ]

    return str(value)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """
    Simple health check.
    """

    return jsonify({
        "status": "ok",
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "model": os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-20b"
        ),
    })


# ---------------------------------------------------------------------------
# Analyze contract
# ---------------------------------------------------------------------------

@app.route("/api/analyze", methods=["POST"])
def analyze_contract():

    global current_qa_chain
    global current_document_name

    try:

        # ---------------------------------------------------------------
        # Check uploaded file
        # ---------------------------------------------------------------

        if "file" not in request.files:
            return jsonify({
                "success": False,
                "error": "No file was uploaded."
            }), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({
                "success": False,
                "error": "No file was selected."
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "Only PDF and DOCX files are supported."
            }), 400

        # ---------------------------------------------------------------
        # Save uploaded file
        # ---------------------------------------------------------------

        original_name = secure_filename(file.filename)

        unique_name = (
            f"{uuid.uuid4().hex[:8]}_{original_name}"
        )

        file_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            unique_name
        )

        file.save(file_path)

        # ---------------------------------------------------------------
        # Create LLM
        # ---------------------------------------------------------------

        llm = get_llm()

        # ---------------------------------------------------------------
        # Step 1 — Parse document
        # ---------------------------------------------------------------

        doc = parse_legal_document(file_path)

        # ---------------------------------------------------------------
        # Step 2 — Build vector index
        # ---------------------------------------------------------------

        index_name = os.path.splitext(
            unique_name
        )[0]

        index_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            f"legal_index_{index_name}"
        )

        vector_store = index_document(
            file_path,
            index_path=index_path
        )

        retriever = get_retriever(
            vector_store,
            k=4
        )

        # ---------------------------------------------------------------
        # Step 3 — Executive summary
        # ---------------------------------------------------------------

        summary = generate_summary(
            doc["full_text"],
            llm
        )

        # ---------------------------------------------------------------
        # Step 4 — Clause extraction
        # ---------------------------------------------------------------

        clauses = extract_clauses(
            doc["full_text"],
            llm
        )

        # ---------------------------------------------------------------
        # Step 5 — Risk analysis
        # ---------------------------------------------------------------

        risks = analyze_risks(
            clauses,
            llm
        )

        # ---------------------------------------------------------------
        # Step 6 — Conflict detection
        # ---------------------------------------------------------------

        conflicts = detect_conflicts(
            clauses,
            llm
        )

        # ---------------------------------------------------------------
        # Step 7 — Build Q&A chain
        # ---------------------------------------------------------------

        current_qa_chain = build_qa_chain(
            retriever,
            llm
        )

        current_document_name = doc["file_name"]

        # ---------------------------------------------------------------
        # Return dashboard data
        # ---------------------------------------------------------------

        return jsonify({
            "success": True,

            "document": {
                "file_name": doc.get(
                    "file_name",
                    original_name
                ),
                "page_count": doc.get(
                    "page_count",
                    0
                ),
                "section_count": len(
                    doc.get("sections", [])
                ),
            },

            "summary": clean_result(summary),

            "clauses": clean_result(clauses),

            "risks": clean_result(risks),

            "conflicts": clean_result(conflicts),

            "model": os.getenv(
                "GROQ_MODEL",
                "openai/gpt-oss-20b"
            ),
        })

    except Exception as e:

        print("\n" + "=" * 70)
        print("ERROR DURING CONTRACT ANALYSIS")
        print("=" * 70)
        traceback.print_exc()
        print("=" * 70 + "\n")

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ---------------------------------------------------------------------------
# Ask question
# ---------------------------------------------------------------------------

@app.route("/api/ask", methods=["POST"])
def ask():

    global current_qa_chain

    try:

        if current_qa_chain is None:
            return jsonify({
                "success": False,
                "error": "Please upload and analyze a contract first."
            }), 400

        data = request.get_json(silent=True) or {}

        question = data.get(
            "question",
            ""
        ).strip()

        if not question:
            return jsonify({
                "success": False,
                "error": "Please enter a question."
            }), 400

        answer = ask_question(
            question,
            current_qa_chain
        )

        return jsonify({
            "success": True,
            "question": question,
            "answer": answer,
        })

    except Exception as e:

        print("\n" + "=" * 70)
        print("ERROR DURING Q&A")
        print("=" * 70)
        traceback.print_exc()
        print("=" * 70 + "\n")

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ---------------------------------------------------------------------------
# Run Flask
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("LEGAL AI ASSISTANT")
    print("=" * 70)

    if os.getenv("GROQ_API_KEY"):
        print("Groq API Key : Loaded")
    else:
        print("Groq API Key : NOT FOUND")

    print(
        "Groq Model   :",
        os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-20b"
        )
    )

    print()
    print("Dashboard    : http://127.0.0.1:5000")
    print("Press CTRL+C to stop the server.")
    print("=" * 70)
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )