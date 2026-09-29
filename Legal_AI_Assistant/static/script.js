// ================================================================
// Global state
// ================================================================

let selectedFile = null;


// ================================================================
// DOM elements
// ================================================================

const fileInput =
    document.getElementById("fileInput");

const dropZone =
    document.getElementById("dropZone");

const selectedFileElement =
    document.getElementById("selectedFile");

const selectedFileName =
    document.getElementById("selectedFileName");

const selectedFileSize =
    document.getElementById("selectedFileSize");

const removeFile =
    document.getElementById("removeFile");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const analyzeBtnText =
    document.getElementById("analyzeBtnText");

const analyzeSpinner =
    document.getElementById("analyzeSpinner");

const uploadError =
    document.getElementById("uploadError");

const uploadSection =
    document.getElementById("uploadSection");

const loadingSection =
    document.getElementById("loadingSection");

const dashboard =
    document.getElementById("dashboard");

const newAnalysisBtn =
    document.getElementById("newAnalysisBtn");

const serverStatus =
    document.getElementById("serverStatus");

const sidebarFile =
    document.getElementById("sidebarFile");

const modelName =
    document.getElementById("modelName");


// ================================================================
// Utility
// ================================================================

function show(element) {
    element.classList.remove("hidden");
}


function hide(element) {
    element.classList.add("hidden");
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


function showError(message) {

    uploadError.textContent = message;

    show(uploadError);
}


function clearError() {

    uploadError.textContent = "";

    hide(uploadError);
}


// ================================================================
// File selection
// ================================================================

fileInput.addEventListener(
    "change",
    function () {

        if (this.files.length > 0) {

            handleFile(
                this.files[0]
            );

        }

    }
);


function handleFile(file) {

    clearError();

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {

        showError(
            "Please select a PDF or DOCX file."
        );

        return;
    }

    if (file.size > 25 * 1024 * 1024) {

        showError(
            "The file is larger than 25 MB."
        );

        return;
    }

    selectedFile = file;

    selectedFileName.textContent =
        file.name;

    selectedFileSize.textContent =
        formatFileSize(file.size);

    show(selectedFileElement);

    analyzeBtn.disabled = false;
}


// ================================================================
// Remove file
// ================================================================

removeFile.addEventListener(
    "click",
    function () {

        selectedFile = null;

        fileInput.value = "";

        hide(selectedFileElement);

        analyzeBtn.disabled = true;

        clearError();
    }
);


// ================================================================
// Drag & Drop
// ================================================================

[
    "dragenter",
    "dragover"
].forEach(eventName => {

    dropZone.addEventListener(
        eventName,
        function (event) {

            event.preventDefault();

            dropZone.classList.add(
                "dragover"
            );

        }
    );

});


[
    "dragleave",
    "drop"
].forEach(eventName => {

    dropZone.addEventListener(
        eventName,
        function (event) {

            event.preventDefault();

            dropZone.classList.remove(
                "dragover"
            );

        }
    );

});


dropZone.addEventListener(
    "drop",
    function (event) {

        const files =
            event.dataTransfer.files;

        if (files.length > 0) {

            handleFile(files[0]);

        }

    }
);


// ================================================================
// Analyze contract
// ================================================================

analyzeBtn.addEventListener(
    "click",
    analyzeContract
);


async function analyzeContract() {

    if (!selectedFile) {
        return;
    }

    clearError();

    analyzeBtn.disabled = true;

    analyzeBtnText.textContent =
        "Analyzing...";

    show(analyzeSpinner);

    hide(uploadSection);

    show(loadingSection);

    // Reset loading state
    setLoadingStep(
        "stepParse",
        "active"
    );

    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            selectedFile
        );

        const response =
            await fetch(
                "/api/analyze",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Contract analysis failed."
            );

        }

        setLoadingStep(
            "stepParse",
            "done"
        );

        setLoadingStep(
            "stepIndex",
            "done"
        );

        setLoadingStep(
            "stepAI",
            "done"
        );

        renderDashboard(data);

    } catch (error) {

        console.error(error);

        hide(loadingSection);

        show(uploadSection);

        analyzeBtn.disabled = false;

        analyzeBtnText.textContent =
            "Analyze Contract";

        hide(analyzeSpinner);

        showError(
            error.message ||
            "Something went wrong while analyzing the contract."
        );

    }

}


// ================================================================
// Loading step
// ================================================================

function setLoadingStep(
    id,
    state
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    const span =
        element.querySelector("span");

    if (state === "done") {

        span.textContent = "✓";

        element.style.background =
            "#ecfdf3";

        element.style.color =
            "#15803d";

    } else if (state === "active") {

        span.textContent = "…";

        element.style.background =
            "#eef2ff";

        element.style.color =
            "#4f46e5";

    }

}


// ================================================================
// Render dashboard
// ================================================================

function renderDashboard(data) {

    hide(loadingSection);

    show(dashboard);

    hide(uploadSection);

    analyzeBtn.disabled = false;

    analyzeBtnText.textContent =
        "Analyze Contract";

    hide(analyzeSpinner);

    const documentData =
        data.document || {};

    const summary =
        data.summary || {};

    const clauses =
        data.clauses || [];

    const risks =
        data.risks || [];

    const conflicts =
        data.conflicts || [];


    // ------------------------------------------------------------
    // Header
    // ------------------------------------------------------------

    document.getElementById(
        "documentName"
    ).textContent =
        documentData.file_name ||
        "Contract";

    document.getElementById(
        "documentMeta"
    ).textContent =
        `${documentData.page_count || 0} page(s) • `
        + `${documentData.section_count || 0} section(s) detected`;


    sidebarFile.textContent =
        documentData.file_name ||
        "Contract";


    modelName.textContent =
        data.model ||
        "Groq GPT-OSS-20B";


    // ------------------------------------------------------------
    // Stats
    // ------------------------------------------------------------

    document.getElementById(
        "pageCount"
    ).textContent =
        documentData.page_count || 0;

    document.getElementById(
        "clauseCount"
    ).textContent =
        clauses.length;

    document.getElementById(
        "riskCount"
    ).textContent =
        risks.length;

    document.getElementById(
        "conflictCount"
    ).textContent =
        conflicts.length;


    // ------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------

    renderSummary(summary);

    // ------------------------------------------------------------
    // Clauses
    // ------------------------------------------------------------

    renderClauses(clauses);

    // ------------------------------------------------------------
    // Risks
    // ------------------------------------------------------------

    renderRisks(risks);

    // ------------------------------------------------------------
    // Conflicts
    // ------------------------------------------------------------

    renderConflicts(conflicts);

    // ------------------------------------------------------------
    // Reset Q&A
    // ------------------------------------------------------------

    resetChat();

    // ------------------------------------------------------------
    // Show summary tab
    // ------------------------------------------------------------

    activateTab("summary");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ================================================================
// Summary renderer
// ================================================================

function renderSummary(summary) {

    document.getElementById(
        "contractType"
    ).textContent =
        summary.contract_type ||
        "Not specified";

    document.getElementById(
        "effectiveDate"
    ).textContent =
        summary.effective_date ||
        "Not specified";

    document.getElementById(
        "duration"
    ).textContent =
        summary.duration ||
        "Not specified";


    // ------------------------------------------------------------
    // Parties
    // ------------------------------------------------------------

    const partiesList =
        document.getElementById(
            "partiesList"
        );

    partiesList.innerHTML = "";

    const parties =
        Array.isArray(summary.parties)
            ? summary.parties
            : [];

    if (parties.length === 0) {

        partiesList.innerHTML =
            `
            <div class="empty-state">
                <strong>No parties identified</strong>
            </div>
            `;

    } else {

        parties.forEach(
            party => {

                let name = party;
                let role = "";

                if (
                    typeof party === "object" &&
                    party !== null
                ) {

                    name =
                        party.name ||
                        party.party ||
                        "Unknown";

                    role =
                        party.role ||
                        party.type ||
                        "";

                }

                partiesList.innerHTML +=
                    `
                    <div class="party-card">

                        <strong>
                            ${escapeHtml(name)}
                        </strong>

                        ${
                            role
                                ? `<span>${escapeHtml(role)}</span>`
                                : ""
                        }

                    </div>
                    `;

            }
        );

    }


    // ------------------------------------------------------------
    // Obligations
    // ------------------------------------------------------------

    const obligationsList =
        document.getElementById(
            "obligationsList"
        );

    obligationsList.innerHTML = "";

    const obligations =
        Array.isArray(summary.key_obligations)
            ? summary.key_obligations
            : [];

    if (obligations.length === 0) {

        obligationsList.innerHTML =
            `
            <li>
                No key obligations identified.
            </li>
            `;

    } else {

        obligations.forEach(
            obligation => {

                obligationsList.innerHTML +=
                    `
                    <li>
                        ${escapeHtml(obligation)}
                    </li>
                    `;

            }
        );

    }


    // ------------------------------------------------------------
    // Summary text
    // ------------------------------------------------------------

    document.getElementById(
        "summaryText"
    ).textContent =
        summary.summary ||
        summary.raw_response ||
        "No summary available.";

}


// ================================================================
// Clause renderer
// ================================================================

function renderClauses(clauses) {

    const container =
        document.getElementById(
            "clausesContainer"
        );

    container.innerHTML = "";

    if (!clauses.length) {

        container.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-icon">
                    📑
                </div>

                <strong>
                    No clauses identified
                </strong>

                <span>
                    The AI did not return any extracted clauses.
                </span>

            </div>
            `;

        return;
    }


    clauses.forEach(
        clause => {

            const type =
                clause.clause_type ||
                "Unknown";

            const section =
                clause.section_reference ||
                "Unknown section";

            const plainEnglish =
                clause.plain_english ||
                clause.description ||
                clause.text ||
                "No description available.";


            container.innerHTML +=
                `
                <div class="clause-card">

                    <div class="clause-top">

                        <span class="clause-type">
                            ${escapeHtml(
                                type
                                    .replaceAll("_", " ")
                            )}
                        </span>

                        <span class="clause-section">
                            ${escapeHtml(section)}
                        </span>

                    </div>

                    <p>
                        ${escapeHtml(
                            plainEnglish
                        )}
                    </p>

                </div>
                `;

        }
    );

}


// ================================================================
// Risk renderer
// ================================================================

function renderRisks(risks) {

    const container =
        document.getElementById(
            "risksContainer"
        );

    container.innerHTML = "";

    if (!risks.length) {

        container.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-icon">
                    ✅
                </div>

                <strong>
                    No risks identified
                </strong>

                <span>
                    No risk items were returned by the analysis.
                </span>

            </div>
            `;

        return;
    }


    risks.forEach(
        risk => {

            const level =
                String(
                    risk.risk_level ||
                    risk.severity ||
                    risk.level ||
                    "medium"
                ).toLowerCase();

            const title =
                risk.title ||
                risk.risk ||
                risk.issue ||
                risk.clause_type ||
                "Potential Risk";

            const description =
                risk.description ||
                risk.explanation ||
                risk.reason ||
                risk.plain_english ||
                "No additional explanation available.";


            container.innerHTML +=
                `
                <div class="risk-card ${escapeHtml(level)}">

                    <div class="risk-header">

                        <strong class="risk-title">
                            ${escapeHtml(title)}
                        </strong>

                        <span class="risk-level ${escapeHtml(level)}">
                            ${escapeHtml(level)}
                        </span>

                    </div>

                    <p>
                        ${escapeHtml(description)}
                    </p>

                </div>
                `;

        }
    );

}


// ================================================================
// Conflict renderer
// ================================================================

function renderConflicts(conflicts) {

    const container =
        document.getElementById(
            "conflictsContainer"
        );

    container.innerHTML = "";

    if (!conflicts.length) {

        container.innerHTML =
            `
            <div class="empty-state">

                <div class="empty-icon">
                    ✅
                </div>

                <strong>
                    No internal conflicts detected
                </strong>

                <span>
                    The conflict detector did not identify
                    any potential contradictions.
                </span>

            </div>
            `;

        return;
    }


    conflicts.forEach(
        conflict => {

            const title =
                conflict.title ||
                conflict.conflict ||
                conflict.issue ||
                "Potential Conflict";

            const description =
                conflict.description ||
                conflict.explanation ||
                conflict.reason ||
                conflict.details ||
                JSON.stringify(conflict);


            container.innerHTML +=
                `
                <div class="conflict-card">

                    <div class="risk-header">

                        <strong class="risk-title">
                            ${escapeHtml(title)}
                        </strong>

                    </div>

                    <p>
                        ${escapeHtml(description)}
                    </p>

                </div>
                `;

        }
    );

}


// ================================================================
// Tabs
// ================================================================

document.querySelectorAll(
    ".tab"
).forEach(
    tab => {

        tab.addEventListener(
            "click",
            function () {

                activateTab(
                    this.dataset.tab
                );

            }
        );

    }
);


function activateTab(tabName) {

    document.querySelectorAll(
        ".tab"
    ).forEach(
        tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );

        }
    );


    document.querySelectorAll(
        ".tab-content"
    ).forEach(
        content => {

            content.classList.toggle(
                "active",
                content.id ===
                    `tab-${tabName}`
            );

        }
    );

}


// ================================================================
// New analysis
// ================================================================

newAnalysisBtn.addEventListener(
    "click",
    function () {

        dashboard.classList.add(
            "hidden"
        );

        uploadSection.classList.remove(
            "hidden"
        );

        selectedFile = null;

        fileInput.value = "";

        selectedFile.classList.add(
            "hidden"
        );

        analyzeBtn.disabled = true;

        analyzeBtnText.textContent =
            "Analyze Contract";

        clearError();

        sidebarFile.textContent =
            "No document uploaded";

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// ================================================================
// Q&A
// ================================================================

const questionInput =
    document.getElementById(
        "questionInput"
    );

const askBtn =
    document.getElementById(
        "askBtn"
    );

const askBtnText =
    document.getElementById(
        "askBtnText"
    );

const askSpinner =
    document.getElementById(
        "askSpinner"
    );

const chatMessages =
    document.getElementById(
        "chatMessages"
    );


askBtn.addEventListener(
    "click",
    askQuestion
);


questionInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            askQuestion();

        }

    }
);


// Suggested questions

document.querySelectorAll(
    ".suggestion"
).forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                questionInput.value =
                    this.dataset.question;

                askQuestion();

            }
        );

    }
);


async function askQuestion() {

    const question =
        questionInput.value.trim();

    if (!question) {
        return;
    }

    addUserMessage(question);

    questionInput.value = "";

    askBtn.disabled = true;

    askBtnText.textContent =
        "Thinking...";

    show(askSpinner);

    try {

        const response =
            await fetch(
                "/api/ask",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Unable to get an answer."
            );

        }

        addAIMessage(
            data.answer
        );

    } catch (error) {

        console.error(error);

        addAIMessage(
            `Sorry, something went wrong: ${error.message}`
        );

    } finally {

        askBtn.disabled = false;

        askBtnText.textContent =
            "Ask AI";

        hide(askSpinner);

    }

}


// ================================================================
// Chat message helpers
// ================================================================

function addUserMessage(message) {

    const welcome =
        chatMessages.querySelector(
            ".chat-welcome"
        );

    if (welcome) {
        welcome.remove();
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message user";

    wrapper.innerHTML =
        `
        <div class="message-bubble">
            ${escapeHtml(message)}
        </div>
        `;

    chatMessages.appendChild(
        wrapper
    );

    scrollChatToBottom();
}


function addAIMessage(message) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "message ai";


    // The existing qa_chain returns a formatted answer
    // that may include a Sources section.
    // Preserve that text rather than inventing source data.

    wrapper.innerHTML =
        `
        <div class="message-bubble">
            ${formatAIText(message)}
        </div>
        `;

    chatMessages.appendChild(
        wrapper
    );

    scrollChatToBottom();
}


function formatAIText(text) {

    if (!text) {
        return "";
    }

    let safe =
        escapeHtml(text);

    // Basic markdown formatting

    safe =
        safe.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );

    safe =
        safe.replace(
            /\n/g,
            "<br>"
        );

    return safe;
}


function scrollChatToBottom() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


function resetChat() {

    chatMessages.innerHTML =
        `
        <div class="chat-welcome">

            <div class="chat-ai-icon">
                ✨
            </div>

            <h3>
                Contract Q&A
            </h3>

            <p>
                Ask me about the provisions contained
                in your uploaded contract.
            </p>

            <div class="suggested-questions">

                <button
                    class="suggestion"
                    data-question="What are the termination rights?"
                >
                    What are the termination rights?
                </button>

                <button
                    class="suggestion"
                    data-question="What is the liability cap?"
                >
                    What is the liability cap?
                </button>

                <button
                    class="suggestion"
                    data-question="What are the confidentiality obligations?"
                >
                    What are the confidentiality obligations?
                </button>

                <button
                    class="suggestion"
                    data-question="Who owns the IP?"
                >
                    Who owns the IP?
                </button>

            </div>

        </div>
        `;


    chatMessages
        .querySelectorAll(
            ".suggestion"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        questionInput.value =
                            this.dataset.question;

                        askQuestion();

                    }
                );

            }
        );

}


// ================================================================
// Health check
// ================================================================

async function checkServer() {

    try {

        const response =
            await fetch(
                "/api/health"
            );

        const data =
            await response.json();

        if (data.status === "ok") {

            serverStatus.innerHTML =
                `
                <span class="status-dot"></span>
                Ready
                `;

            modelName.textContent =
                data.model ||
                "Groq GPT-OSS-20B";

        }

    } catch (error) {

        serverStatus.innerHTML =
            `
            <span
                class="status-dot"
                style="background:#dc2626"
            ></span>
            Offline
            `;

    }

}


checkServer();