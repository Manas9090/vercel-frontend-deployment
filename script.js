/* =========================================================
   AURAOS — AI TRAVEL ASSISTANT
   Frontend Controller
========================================================= */


/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

// const API_BASE_URL = "http://Madhuravihar1011-backend-1456691225.us-east-1.elb.amazonaws.com";

// const CHAT_ENDPOINT = "/api/chat";
// const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

const API_BASE_URL = "https://sale-manas-kamina.bluepebble-7d93a74b.westus2.azurecontainerapps.io";
const CHAT_ENDPOINT = `${API_BASE_URL}/chat`;

// const CHAT_ENDPOINT = "/chat";

const USER_ID = "web_user";

/* =========================================================
   APPLICATION STATE
========================================================= */

let sessionId = createSessionId();

let isWaitingForResponse = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

let welcomeScreen;
let conversationArea;
let chatWindow;
let chatInput;
let sendChatButton;
let newChatButton;
let recentChats;


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeElements();

    initializeEventListeners();

    initializeQuickActions();

    initializeSidebarActions();

    updateSendButtonState();

    console.log("AuraOS frontend initialized.");

});


/* =========================================================
   GET DOM ELEMENTS
========================================================= */

function initializeElements() {

    welcomeScreen =
        document.getElementById("welcomeScreen");

    conversationArea =
        document.getElementById("conversationArea");

    chatWindow =
        document.getElementById("chatWindow");

    chatInput =
        document.getElementById("chatInput");

    sendChatButton =
        document.getElementById("sendChatButton");

    newChatButton =
        document.getElementById("newChatButton");

    recentChats =
        document.getElementById("recentChats");

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    /* SEND BUTTON */

    if (sendChatButton) {

        sendChatButton.addEventListener(
            "click",
            handleSendMessage
        );

    }


    /* TEXTAREA */

    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            handleInputKeydown
        );

        chatInput.addEventListener(
            "input",
            handleInputChange
        );

    }


    /* NEW CHAT */

    if (newChatButton) {

        newChatButton.addEventListener(
            "click",
            startNewChat
        );

    }

}


/* =========================================================
   TEXTAREA KEYBOARD HANDLING
========================================================= */

function handleInputKeydown(event) {

    /*
       ENTER = SEND

       SHIFT + ENTER = NEW LINE
    */

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        handleSendMessage();

    }

}


/* =========================================================
   TEXTAREA INPUT CHANGE
========================================================= */

function handleInputChange() {

    updateSendButtonState();

    autoResizeTextarea();

}


/* =========================================================
   AUTO RESIZE TEXTAREA
========================================================= */

function autoResizeTextarea() {

    if (!chatInput) {
        return;
    }

    chatInput.style.height = "auto";

    const newHeight =
        Math.min(
            chatInput.scrollHeight,
            130
        );

    chatInput.style.height =
        `${newHeight}px`;

}


/* =========================================================
   SEND BUTTON STATE
========================================================= */

function updateSendButtonState() {

    if (!sendChatButton || !chatInput) {
        return;
    }

    const message =
        chatInput.value.trim();

    sendChatButton.disabled =
        message.length === 0 ||
        isWaitingForResponse;

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function initializeQuickActions() {

    const quickActions =
        document.querySelectorAll(
            ".quick-action"
        );

    quickActions.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const prompt =
                    button.dataset.prompt;

                if (!prompt) {
                    return;
                }

                sendPrompt(prompt);

            }
        );

    });


    /* DESTINATION CARDS */

    const destinationCards =
        document.querySelectorAll(
            ".destination-card"
        );

    destinationCards.forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const prompt =
                    card.dataset.prompt;

                if (!prompt) {
                    return;
                }

                sendPrompt(prompt);

            }
        );

    });

}


/* =========================================================
   SIDEBAR ACTIONS
========================================================= */

function initializeSidebarActions() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const action =
                    item.dataset.action;

                handleSidebarAction(
                    action
                );

            }
        );

    });

}


/* =========================================================
   SIDEBAR ACTION HANDLER
========================================================= */

function handleSidebarAction(action) {

    switch (action) {

        case "hotels":

            sendPrompt(
                "I want to find a hotel"
            );

            break;


        case "trips":

            sendPrompt(
                "Help me plan a trip"
            );

            break;


        case "bookings":

            sendPrompt(
                "Show me my bookings"
            );

            break;


        case "concierge":

            sendPrompt(
                "I need help from the travel concierge"
            );

            break;


        default:

            console.log(
                "Unknown sidebar action:",
                action
            );

    }

}


/* =========================================================
   SEND QUICK PROMPT
========================================================= */

function sendPrompt(prompt) {

    if (isWaitingForResponse) {
        return;
    }

    if (!prompt) {
        return;
    }

    chatInput.value = prompt;

    updateSendButtonState();

    handleSendMessage();

}


/* =========================================================
   MAIN SEND MESSAGE FUNCTION
========================================================= */

async function handleSendMessage() {

    if (isWaitingForResponse) {
        return;
    }

    if (!chatInput) {
        return;
    }

    const message =
        chatInput.value.trim();


    /* EMPTY MESSAGE */

    if (!message) {
        return;
    }


    /* SHOW CHAT AREA */

    showConversation();


    /* ADD USER MESSAGE */

    appendMessage(
        "user",
        message
    );


    /* CLEAR INPUT */

    chatInput.value = "";

    chatInput.style.height = "auto";

    updateSendButtonState();


    /* SEND TO BACKEND */

    await sendMessageToBackend(message);

}


/* =========================================================
   SEND MESSAGE TO BACKEND
========================================================= */

async function sendMessageToBackend(message) {

    isWaitingForResponse = true;

    updateSendButtonState();


    /* SHOW TYPING INDICATOR */

    const typingId =
        showTypingIndicator();


    try {

        console.log(
            "Sending request to:",
            CHAT_ENDPOINT
        );


        const response =
            await fetch(
                CHAT_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: message,

                        user_id: USER_ID,

                        session_id: sessionId

                    })

                }
            );


        console.log(
            "Backend HTTP status:",
            response.status
        );


        /* REMOVE TYPING INDICATOR */

        removeTypingIndicator(
            typingId
        );


        /* =================================================
           HANDLE HTTP ERRORS
        ================================================= */

        if (!response.ok) {

            const errorText =
                await safelyReadResponse(
                    response
                );

            console.error(
                "Backend error:",
                response.status,
                errorText
            );


            appendMessage(
                "assistant",
                createHttpErrorMessage(
                    response.status
                )
            );


            return;
        }


        /* =================================================
           READ SUCCESS RESPONSE SAFELY
        ================================================= */

        const data =
            await safelyParseJson(
                response
            );


        console.log(
            "Backend response:",
            data
        );


        /* =================================================
           EXTRACT RESPONSE TEXT
        ================================================= */

        const assistantMessage =
            extractAssistantMessage(
                data
            );


        /* =================================================
           DISPLAY RESPONSE
        ================================================= */

        if (assistantMessage) {

            appendMessage(
                "assistant",
                assistantMessage
            );

        } else {

            appendMessage(
                "assistant",
                "I received a response from the server, but there was no message to display."
            );

        }


        /* SAVE RECENT CHAT */

        saveRecentChat(
            message
        );


    } catch (error) {

        /* REMOVE TYPING INDICATOR */

        removeTypingIndicator(
            typingId
        );


        console.error(
            "Frontend request error:",
            error
        );


        appendMessage(
            "assistant",
            createNetworkErrorMessage(
                error
            )
        );


    } finally {

        isWaitingForResponse = false;

        updateSendButtonState();

        scrollChatToBottom();

    }

}


/* =========================================================
   SAFE JSON PARSER
========================================================= */

async function safelyParseJson(response) {

    const contentType =
        response.headers.get(
            "content-type"
        );


    /*
       If backend doesn't return JSON,
       don't blindly call response.json().
    */

    if (
        !contentType ||
        !contentType.includes("application/json")
    ) {

        const text =
            await response.text();

        console.warn(
            "Response was not JSON:",
            text
        );

        return {
            response: text
        };

    }


    /*
       Read the body as text first.

       This prevents:

       Unexpected end of JSON input
    */

    const text =
        await response.text();


    if (!text || !text.trim()) {

        return {};

    }


    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "Invalid JSON received:",
            error
        );

        return {
            response: text
        };

    }

}


/* =========================================================
   SAFE RESPONSE READER
========================================================= */

async function safelyReadResponse(response) {

    try {

        const text =
            await response.text();

        return text || "";

    } catch (error) {

        console.error(
            "Unable to read error response:",
            error
        );

        return "";

    }

}


/* =========================================================
   EXTRACT ASSISTANT MESSAGE
========================================================= */

function extractAssistantMessage(data) {

    if (!data) {
        return "";
    }


    /*
       Current backend is expected
       to return:

       {
           "response": "..."
       }
    */

    if (
        typeof data.response === "string"
    ) {

        return data.response;

    }


    /*
       Additional compatibility
    */

    if (
        typeof data.message === "string"
    ) {

        return data.message;

    }


    if (
        typeof data.answer === "string"
    ) {

        return data.answer;

    }


    /*
       Sometimes backend may return
       nested response objects.
    */

    if (
        data.data &&
        typeof data.data.response === "string"
    ) {

        return data.data.response;

    }


    if (
        data.result &&
        typeof data.result.response === "string"
    ) {

        return data.result.response;

    }


    return "";

}


/* =========================================================
   SHOW CONVERSATION
========================================================= */

function showConversation() {

    if (welcomeScreen) {

        welcomeScreen.classList.add(
            "hidden"
        );

    }


    if (conversationArea) {

        conversationArea.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   APPEND MESSAGE
========================================================= */

function appendMessage(
    sender,
    message
) {

    if (!chatWindow) {
        return;
    }


    const messageContainer =
        document.createElement(
            "div"
        );


    messageContainer.className =
        `chat-message ${sender}`;


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    /*
       IMPORTANT:

       Use textContent instead of
       innerHTML.

       This prevents user/backend
       text from being interpreted
       as HTML.
    */

    bubble.textContent =
        message;


    messageContainer.appendChild(
        bubble
    );


    chatWindow.appendChild(
        messageContainer
    );


    scrollChatToBottom();

}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTypingIndicator() {

    if (!chatWindow) {
        return null;
    }


    const id =
        `typing-${Date.now()}`;


    const messageContainer =
        document.createElement(
            "div"
        );


    messageContainer.className =
        "chat-message assistant";


    messageContainer.id = id;


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    const indicator =
        document.createElement(
            "div"
        );


    indicator.className =
        "typing-indicator";


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const dot =
            document.createElement(
                "span"
            );

        indicator.appendChild(
            dot
        );

    }


    bubble.appendChild(
        indicator
    );


    messageContainer.appendChild(
        bubble
    );


    chatWindow.appendChild(
        messageContainer
    );


    scrollChatToBottom();


    return id;

}


/* =========================================================
   REMOVE TYPING INDICATOR
========================================================= */

function removeTypingIndicator(id) {

    if (!id) {
        return;
    }


    const element =
        document.getElementById(id);


    if (element) {

        element.remove();

    }

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChatToBottom() {

    if (!conversationArea) {
        return;
    }


    setTimeout(() => {

        conversationArea.scrollTo(
            {
                top:
                    conversationArea.scrollHeight,

                behavior: "smooth"
            }
        );

    }, 50);

}


/* =========================================================
   HTTP ERROR MESSAGE
========================================================= */

function createHttpErrorMessage(
    status
) {

    if (status === 404) {

        return (
            "I couldn't reach the AuraOS chat endpoint. " +
            "The server returned 404 (Not Found). " +
            "Please check the frontend API routing."
        );

    }


    if (status === 502) {

        return (
            "AuraOS is temporarily unable to reach the backend service. " +
            "The server returned 502 (Bad Gateway). " +
            "Please check the ECS/ALB backend connection."
        );

    }


    if (status === 500) {

        return (
            "AuraOS encountered an internal server error. " +
            "Please check the backend logs."
        );

    }


    return (
        `AuraOS received an HTTP ${status} error from the backend.`
    );

}


/* =========================================================
   NETWORK ERROR MESSAGE
========================================================= */

function createNetworkErrorMessage(
    error
) {

    return (
        "I couldn't connect to the AuraOS backend. " +
        "Please check whether the backend is running and whether " +
        "the frontend API route is reachable."
    );

}


/* =========================================================
   CREATE SESSION ID
========================================================= */

function createSessionId() {

    return (
        "session-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* =========================================================
   NEW CHAT
========================================================= */

function startNewChat() {

    if (isWaitingForResponse) {

        return;

    }


    /* CREATE NEW SESSION */

    sessionId =
        createSessionId();


    /* CLEAR CHAT */

    if (chatWindow) {

        chatWindow.innerHTML = "";

    }


    /* SHOW WELCOME SCREEN */

    if (conversationArea) {

        conversationArea.classList.add(
            "hidden"
        );

    }


    if (welcomeScreen) {

        welcomeScreen.classList.remove(
            "hidden"
        );

    }


    /* CLEAR INPUT */

    if (chatInput) {

        chatInput.value = "";

        chatInput.style.height =
            "auto";

    }


    updateSendButtonState();


    console.log(
        "New AuraOS session:",
        sessionId
    );

}


/* =========================================================
   RECENT CHAT
========================================================= */

function saveRecentChat(message) {

    if (!recentChats) {
        return;
    }


    /*
       Remove empty message
    */

    const emptyMessage =
        recentChats.querySelector(
            ".empty-recent"
        );


    if (emptyMessage) {

        emptyMessage.remove();

    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "recent-chat-item";


    item.textContent =
        truncateText(
            message,
            32
        );


    item.style.padding =
        "9px 10px";


    item.style.borderRadius =
        "8px";


    item.style.color =
        "#8ea0b3";


    item.style.fontSize =
        "12px";


    item.style.cursor =
        "pointer";


    item.addEventListener(
        "click",
        () => {

            chatInput.value =
                message;

            updateSendButtonState();

            handleSendMessage();

        }
    );


    recentChats.prepend(
        item
    );


    /*
       Keep only the latest
       five conversations.
    */

    while (
        recentChats.children.length > 5
    ) {

        recentChats.lastElementChild.remove();

    }

}


/* =========================================================
   TRUNCATE TEXT
========================================================= */

function truncateText(
    text,
    maxLength
) {

    if (
        !text ||
        text.length <= maxLength
    ) {

        return text;

    }


    return (
        text.substring(
            0,
            maxLength
        ) + "..."
    );

}