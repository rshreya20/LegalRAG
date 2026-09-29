# ⚖️ LegalRAG

### AI-Powered Legal Contract Analysis using Retrieval-Augmented Generation

LegalRAG is an AI-powered contract analysis application that uses **Retrieval-Augmented Generation (RAG)** to analyze legal documents and provide users with relevant, context-aware answers.

The system allows users to upload **PDF or DOCX contracts** and automatically analyzes the document to generate summaries, extract important clauses, identify potential risks, detect possible conflicts, and answer questions about the contract.

---

## 📌 What is LegalRAG?

LegalRAG combines **Large Language Models (LLMs)** with **Retrieval-Augmented Generation** to make legal documents easier to understand and query.

Instead of sending the complete contract to the AI every time a user asks a question, LegalRAG:

1. Parses the uploaded document.
2. Splits the document into smaller chunks.
3. Generates embeddings for the chunks.
4. Creates a searchable vector index.
5. Retrieves the most relevant sections when a question is asked.
6. Sends the relevant context to the LLM.
7. Generates a response based on the retrieved contract content.

This approach helps the system focus on the actual information contained in the uploaded document.

---

# 🎯 Problem Statement

Legal contracts can be lengthy, complex, and difficult to analyze manually.

Users may need to spend significant time searching for information such as:

- Termination conditions
- Liability limitations
- Confidentiality requirements
- Governing law
- Important obligations
- Potential risks
- Conflicting clauses
- Specific contractual rights

Traditional document search mainly depends on keywords, which may not always understand the meaning behind a question.

For example, a user may ask:

> "What happens if I want to end this agreement?"

Even if the contract does not contain the exact phrase "end this agreement", the relevant section may use the word **termination**.

LegalRAG uses semantic retrieval to locate relevant contract content and provide an answer using the retrieved context.

---


## 🚀 Key Features

### 📄 Contract Upload
- Upload PDF and DOCX contracts
- Automatic document processing
- File validation through the web interface
- Supports contracts up to the configured file-size limit

### 📋 Executive Summary
Generates a concise overview of the uploaded contract, including important parties, obligations, and key provisions.

### 🔍 Clause Extraction
Identifies important contractual clauses such as:

- Termination
- Limitation of Liability
- Confidentiality
- Governing Law
- Intellectual Property

### ⚠️ Risk Analysis
Analyzes the contract to identify potential risks and provisions that may require further attention.

### 🔄 Conflict Detection
Detects potential inconsistencies or conflicting provisions within the contract.

### 🧩 Document Chunking
Large documents are divided into smaller chunks before being indexed.

Chunking allows the system to retrieve only the most relevant sections when answering a question instead of sending the entire document to the LLM.

Example:

```text
Large Contract
      ↓
Document Parsing
      ↓
Text Chunking
      ↓
 ┌──────────┐
 │ Chunk 1  │
 │ Chunk 2  │
 │ Chunk 3  │
 │ Chunk 4  │
 │    ...   │
 └──────────┘
      ↓
Vector Index
      ↓
Relevant Chunks Retrieved 
```
---

## 🛠️ TECH STACK
- ### Backend
    Python
    Flask
    LangChain
    RAG (Retrieval-Augmented Generation)
- ### AI / LLM
    Groq API
    openai/gpt-oss-20b
    LLM-based contract analysis
- ### Document Processing
    Python document parsing
    PDF processing
    DOCX processing
    Text chunking
- ### Vector Search
    Hugging Face embeddings
    Vector database / local vector index
    Semantic similarity search
- ### Frontend
    HTML5
    CSS3
    JavaScript
- ### Responsive web interface
    Development Tools
    VS Code
    Python Virtual Environment
    Git/GitHub
    
---

## ⚙️ Running LegalRAG Locally
### 1. Clone the Repository
    git clone <your-github-repository-url>
    cd LegalRAG
### 2. Create a Virtual Environment
    python -m venv venv
### 3. Activate the Virtual Environment

Windows PowerShell:

    venv\Scripts\Activate.ps1
### 4. Install Dependencies
    pip install -r requirements.txt
### 5. Configure Environment Variables

Create a .env file in the project root:

    GROQ_API_KEY=your_groq_api_key
    GROQ_MODEL=openai/gpt-oss-20b

#### Do not upload your .env file to GitHub.

### 6. Start the Application
    python app.py

Then open the local URL shown in the terminal, usually:

    http://127.0.0.1:5000

### 7. Use the Application
- Open the LegalRAG dashboard. 
- Upload a PDF or DOCX contract.
- Click Analyze Contract.
- Wait for the document to be processed.
- Review the summary, extracted clauses, risk analysis, and conflict detection.
- Ask questions about the uploaded contract using the RAG-based Q&A interface.
---

## ⚠️ Legal Disclaimer

#### LegalRAG  is an educational and technical demonstration of Retrieval-Augmented Generation for document analysis.

#### It does not provide legal advice and should not be used as a substitute for consultation with a qualified legal professional.

#### Always verify important findings and interpretations with a qualified attorney.

---

## 👩‍💻 Author

#### Shreya Rai

#### B.Tech Computer Science Engineering | AI/ML & Cybersecurity
