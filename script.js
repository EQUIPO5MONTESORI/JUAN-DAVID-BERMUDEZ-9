const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// ====== API KEY ======
// La key NO se escribe en este archivo (así no se filtra en GitHub).
// La primera vez la página la pide y la guarda en ese computador.
function obtenerKey() {
    let key = localStorage.getItem("geminiKey");
    if (!key) {
        key = (prompt("Pega la API key de la profe:") || "").trim();
        if (key) localStorage.setItem("geminiKey", key);
    }
    return key;
}

window.onload = () => {
    const savedChat = localStorage.getItem("chatHistory");

    // Si el chat guardado tiene un error viejo, no lo cargamos
    if (savedChat && !savedChat.includes("no longer available") && !savedChat.includes("high demand")) {
        chatBox.innerHTML = savedChat;
    } else {
        localStorage.removeItem("chatHistory");
    }

    chatBox.scrollTop = chatBox.scrollHeight;
};

function addMessage(message, classNme) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", classNme);
    msgDiv.textContent = message;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message");
    typingDiv.textContent = "AI is typing...";
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
}

async function getBotReplay(userMessage) {
    const apiKey = obtenerKey();
    if (!apiKey) {
        return "Falta la API key. Recarga la página y pégala cuando te la pida.";
    }

    // Si el primero está ocupado, prueba con el segundo
    const modelos = ["gemini-flash-latest", "gemini-flash-lite-latest"];

    for (const modelo of modelos) {
        const url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent";

        for (let intento = 0; intento < 2; intento++) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userMessage }] }]
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get that.";
                }

                console.error("API Error (" + modelo + "):", data);

                // Key mala o desactivada
                if (response.status === 400 || response.status === 401 || response.status === 403) {
                    localStorage.removeItem("geminiKey");
                    return "La API key no sirve. Recarga la página y pega una key válida.";
                }

                // Modelo no existe: pasa al siguiente
                if (response.status === 404) break;

                // Ocupado o límite: espera y reintenta
                if (response.status === 429 || response.status === 500 || response.status === 503) {
                    await new Promise(r => setTimeout(r, 1500));
                    continue;
                }

                return (data && data.error && data.error.message) || "Error fetching response.";
            } catch (error) {
                console.error("Catch Error:", error);
                return "Error de conexión.";
            }
        }
    }

    return "Gemini está muy ocupado en este momento. Espera unos segundos e intenta de nuevo.";
}

sendBtn.onclick = async () => {
    const message = userInput.value.trim();
    if (message === "") return;
    addMessage(message, "user-message");
    userInput.value = "";

    const typingDiv = showTyping();

    const botReplay = await getBotReplay(message);
    typingDiv.remove();

    addMessage(botReplay, "bot-message");

    localStorage.setItem("chatHistory", chatBox.innerHTML);
};

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
});
