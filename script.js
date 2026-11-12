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
    if (savedChat && !savedChat.includes("no longer available") && !savedChat.includes("API key")) {
        chatBox.innerHTML = savedChat;
    } else {
        localStorage.removeItem("chatHistory");
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

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

    // Si Google cambia el nombre del modelo, solo cambia "gemini-flash-latest"
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

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

        if (!response.ok) {
            console.error("API Error:", data);

            // Key mala o desactivada: se borra para que la pida de nuevo
            if (response.status === 400 || response.status === 401 || response.status === 403) {
                localStorage.removeItem("geminiKey");
                return "La API key no sirve. Recarga la página y pega una key válida.";
            }
            if (response.status === 429) {
                return "Hay muchos mensajes a la vez. Espera unos segundos e intenta de nuevo.";
            }
            return data?.error?.message || "Error fetching response.";
        }

        return (
            data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get that."
        );
    } catch (error) {
        console.error("Catch Error:", error);
        return "Error de conexión.";
    }
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
}

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
})
