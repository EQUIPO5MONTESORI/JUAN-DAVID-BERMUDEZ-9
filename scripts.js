import { apiKey } from "./config.js"

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

window.onload = () => {
    const savedChat = localStorage.getItem("chatHistory");
    console.log({savedChat});
    
    // Si el chat guardado tiene el error de "no longer available", no lo cargamos
    if (savedChat && !savedChat.includes("no longer available")) {
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
    // Modelo Gemini 2.0 Flash activo
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                contents: [{parts: [{text: userMessage}]}]
            })
        })

        const data = await response.json();

        if (!response.ok) {
            console.error("API Error:", data);
            return data?.error?.message || "Error fetching response."
        }

        return (
            data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get that."
        )
    } catch (error) {
        console.error("Catch Error:", error);
        return "Error de conexión.";
    }
}

sendBtn.onclick = async () => {
    const message = userInput.value.trim();
    if (message === "") return;
    addMessage(message, "user-message");
    userInput.value = ""

    const typingDiv = showTyping();

    const botReplay = await getBotReplay(message);
    typingDiv.remove();

    addMessage(botReplay, "bot-message");

    localStorage.setItem("chatHistory", chatBox.innerHTML);
}

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
})
