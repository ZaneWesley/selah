const MODEL_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_TOKEN = "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"; 
const MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"; 

const viewHome = document.getElementById('viewHome');
const viewChat = document.getElementById('viewChat');
const timelineFeed = document.getElementById('timelineFeed');
const gatewayScreen = document.getElementById('gatewayScreen');
const messageArea = document.getElementById('messageArea');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const fabBtn = document.getElementById('fabBtn');
const backBtn = document.getElementById('backBtn');
const deleteBtn = document.getElementById('deleteBtn');
const mainAppHeaderTitle = document.getElementById('mainAppHeaderTitle');

const chooseChatBtn = document.getElementById('chooseChatBtn');
const chooseSoloBtn = document.getElementById('chooseSoloBtn');
const soloJournalBox = document.getElementById('soloJournalBox');
const inputAreaPanel = document.getElementById('inputAreaPanel');

// Persistent Memory Core Variables
let userData = JSON.parse(localStorage.getItem('journalUserProfile')) || null;
let aiResponseTimeout = null; 
let isAiThinking = false; 

let journalEntries = JSON.parse(localStorage.getItem('selah_journal_db')) || {};
let currentSessionId = null;

function getDynamicSystemPrompt(user) {
    // Format the learned background facts into a clean bulleted list string
    const memoriesString = user.learnedMemories.length > 0 
        ? user.learnedMemories.map(m => `- ${m}`).join('\n')
        : "- No extra background context learned yet.";

    return `You are a perceptive, grounded, and deeply authentic friend texting the user. This is a private chat-journal space. Your role is to be a supportive, mature sounding board—never a clinical psychologist, never an artificial assistant, and absolutely NO "therapy speak."

    KNOWN DETAILS ABOUT YOUR FRIEND:
    - Name: ${user.name}
    - Pronouns: ${user.pronouns}
    - Quick Summary: ${user.bioSummary}
    - Interests/Hobbies: ${user.hobbies.join(', ')}
    - Core Background/Values: ${user.values}

    BACKGROUND CONTEXT REMEMBERED FROM PAST CONVERSATIONS:
    ${memoriesString}

    CRITICAL INTERACTION RULES:
    1. MATCH THE USER'S ENERGY: If the user gives short, vague, or neutral answers, match their low energy with a simple, grounded, casual response. Do not be overly positive or bubbly.
    2. SUBTLE PERSONALIZATION (ANTI-AI CREEPINESS): Use the profile details and background context above ONLY when it is directly relevant to what the user is talking about. Never bring up a past memory or hobby out of nowhere just to prove you "know" it. Let references happen casually and naturally over time, exactly like a close friend would.
    3. NO PSYCHOLOGICAL ANALYSIS: Never explain the user's feelings to them. Just react like a normal person would.
    4. USE CONTEXT NATURALLY: Actively reference the chat history or remembered background facts instead of falling back on generic filler questions.

    TONAL & TEXTING RULES:
    1. BE CONCISE: Keep your text messages relatively short and digestible. Real friends text in short bursts.
    2. BANISH AI PHRASES: Absolutely zero corporate or chatbot boilerplate phrases.
    3. LANGUAGE CONSTRAINT: You must write your responses exclusively in English.`;
}

// Operational Navigation State Manager
function initApp() {
    renderTimeline();
    
    // Default Landing Screen Setup State
    viewHome.classList.add('active');
    viewChat.classList.remove('active');
    gatewayScreen.style.display = 'flex';
    timelineFeed.style.display = 'none';
    fabBtn.style.display = 'flex';
    fabBtn.innerHTML = '<span class="material-symbols-rounded">auto_stories</span>';

    // Toggle button operational flow logic
    fabBtn.addEventListener('click', () => {
        if (timelineFeed.style.display === 'none') {
            gatewayScreen.style.display = 'none';
            timelineFeed.style.display = 'grid';
            fabBtn.innerHTML = '<span class="material-symbols-rounded">add_circle</span>';
        } else {
            timelineFeed.style.display = 'none';
            gatewayScreen.style.display = 'flex';
            fabBtn.innerHTML = '<span class="material-symbols-rounded">auto_stories</span>';
        }
    });

    // Wire Up Choice Gateway Options
    chooseChatBtn.addEventListener('click', (e) => createNewEntry('chat', e.currentTarget));
    chooseSoloBtn.addEventListener('click', (e) => createNewEntry('solo', e.currentTarget));
    
    backBtn.addEventListener('click', closeChatView);
    deleteBtn.addEventListener('click', deleteCurrentEntry);
    sendBtn.addEventListener('click', handleInputSubmission);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleInputSubmission(); });
}

function renderTimeline() {
    timelineFeed.innerHTML = '';
    
    const entriesArray = Object.keys(journalEntries).map(id => {
        return { id: id, ...journalEntries[id] };
    });
    
    if (entriesArray.length === 0) {
        timelineFeed.innerHTML = '<div class="empty-state">No entries yet.<br>Choose an options layout to start processing.</div>';
        return;
    }
    
    entriesArray.sort((a, b) => (b.lastEdited || 0) - (a.lastEdited || 0));
    
    entriesArray.forEach((entry, index) => {
        const textMessages = entry.history.filter(m => m.role !== 'system');
        const lastMsg = textMessages.length > 0 ? textMessages[textMessages.length - 1].content : "Empty notebook...";
        
        const isHero = index === 0;
        const isChat = entry.mode === 'chat';
        const badgeClass = isChat ? 'card-badge badge-chat' : 'card-badge';
        const badgeText = isChat ? '<span class="material-symbols-rounded">chat_bubble</span>' : '<span class="material-symbols-rounded">border_color</span>';

        const card = document.createElement('div');
        card.classList.add('journal-card');
        if (isHero) card.classList.add('hero-card');

        const maxCharacters = isHero ? 110 : 45;
        const cleanPreview = lastMsg.length > maxCharacters ? lastMsg.substring(0, maxCharacters) + "..." : lastMsg;

        card.innerHTML = `
            <div class="card-meta">
                <div class="card-date">${entry.date}</div>
                <div class="card-badge ${badgeClass}">${badgeText}</div>
            </div>
            <div class="card-title" style="font-size: ${isHero ? '18px' : '14px'}; -webkit-line-clamp: ${isHero ? '2' : '1'}; margin-bottom: ${isHero ? '6px' : '2px'};">${entry.title}</div>
            <div class="card-preview" style="-webkit-line-clamp: ${isHero ? '3' : '2'}; font-size: ${isHero ? '13px' : '12px'};">${cleanPreview}</div>
        `;
        
        card.addEventListener('click', (e) => openChatView(entry.id, card));
        timelineFeed.appendChild(card);
    });
}

function createNewEntry(mode, clickedElement) {
    currentSessionId = 'journal_' + Date.now();
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    journalEntries[currentSessionId] = {
        title: mode === 'chat' ? "New Chat Journal" : "New Private Notebook",
        date: dateStr,
        lastEdited: Date.now(),
        mode: mode, 
        history: [{ role: "system", content: getDynamicSystemPrompt(userData) }]
    };
    
    saveToStorage();
    openChatView(currentSessionId, clickedElement);
}

// Custom function to handle structural container expansions using coordinates
function openChatView(id, sourceElement) {
    currentSessionId = id;
    const entry = journalEntries[id];
    
    setTimeout(() => {
        mainAppHeaderTitle.innerText = entry.title;
    }, 100);
    backBtn.style.display = "flex";
    deleteBtn.style.display = "flex";
    fabBtn.style.display = "none"; // Conceal FAB control on entry active session
    
    messageArea.innerHTML = '';
    soloJournalBox.value = '';
    
    updateUserBubbleColor(entry.mode);

    if (entry.mode === 'chat') {
        soloJournalBox.style.display = 'none';
        messageArea.style.display = 'flex';
        inputAreaPanel.style.display = 'flex';
        
        entry.history.forEach(msg => {
            if(msg.role !== 'system') {
                appendBubble(msg.content, msg.role === 'user' ? 'user' : 'friend');
            }
        });
        
        if (entry.history.length === 1) {
            appendBubble("Hey there! This space is all yours and I'm here to listen.", 'friend');
        }
        setTimeout(() => { messageArea.scrollTop = messageArea.scrollHeight; }, 50);
    } else {
        messageArea.style.display = 'none';
        inputAreaPanel.style.display = 'none';
        soloJournalBox.style.display = 'block';
        
        const userParagraphs = entry.history
            .filter(m => m.role === 'user')
            .map(m => m.content);
            
        soloJournalBox.value = userParagraphs.join('\n\n');
        let localParagraphMarkerCount = soloJournalBox.value.trim() ? soloJournalBox.value.trim().split('\n\n').length : 0;

        soloJournalBox.oninput = () => {
            const currentText = soloJournalBox.value.trim();
            const updatedParagraphs = currentText.split('\n\n').filter(p => p.trim() !== '');
            
            entry.history = [{ role: "system", content: getDynamicSystemPrompt(userData) }];
            updatedParagraphs.forEach(para => {
                entry.history.push({ role: "user", content: para.trim() });
            });
            
            entry.lastEdited = Date.now();
            saveToStorage();
            renderSoloEscapeHatch();
            
            const activeParagraphCount = updatedParagraphs.length;
            if (activeParagraphCount > 0 && activeParagraphCount !== localParagraphMarkerCount) {
                localParagraphMarkerCount = activeParagraphCount;
                generateAutoTitle(currentSessionId);
            }
            mineNewMemoriesFromChat(entry.history);
        };
    }
    
    renderSoloEscapeHatch();

    // SMOOTH GEOMETRIC VISUAL CONTAINER FLIP EXPANSION ENGINE
    if (sourceElement) {
        // 1. Capture the structural bounds of the origin element and app shell
        const rect = sourceElement.getBoundingClientRect();
        const shell = document.querySelector('.app-shell').getBoundingClientRect();
        const computedStyle = window.getComputedStyle(sourceElement);

        // 2. Fade out the text contents inside the real card so they don't stretch layout text lines distortingly
        const cardChildren = sourceElement.children;
        for (let child of cardChildren) {
            child.classList.add('fade-out-content');
        }

        // 3. Construct our ghost element and extract styling values directly from the source card
        const ghost = document.createElement('div');
        ghost.className = 'morphing-element';
        
        // Exact styling match injection
        ghost.style.top = `${rect.top}px`;
        ghost.style.left = `${rect.left}px`;
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        ghost.style.borderRadius = computedStyle.borderRadius;
        ghost.style.background = computedStyle.background;
        ghost.style.backdropFilter = computedStyle.backdropFilter;
        ghost.style.webkitBackdropFilter = computedStyle.webkitBackdropFilter;
        ghost.style.border = computedStyle.border;
        ghost.style.boxShadow = computedStyle.boxShadow;
        
        document.body.appendChild(ghost);
        
        // Force layout engine reflow tick
        ghost.getBoundingClientRect(); 

        // 4. Fire the transition towards the final layout container boundary metrics
        ghost.style.top = `${shell.top}px`;
        ghost.style.left = `${shell.left}px`;
        ghost.style.width = `${shell.width}px`;
        ghost.style.height = `${shell.height}px`;
        ghost.style.borderRadius = '0'; // Matches your main app shell rounding bounds
        ghost.style.backgroundColor = 'transparent';
        ghost.style.border = 'none';
        ghost.style.opacity = '0';
        ghost.style.backdropFilter = 'blur(4px)';
        ghost.style.webkitBackdropFilter = 'blur(4px)';
        
        // If transitioning from a notebook card vs a chat card, morph color naturally if needed
        // if (entry.mode === 'chat') {
        //     //ghost.style.backgroundColor = 'rgba(255, 255, 255, 0.45)';
        //     ghost.style.backgroundColor = 'transparent';
        // }

        // 5. Swap views elegantly right before the animation completes
        setTimeout(() => {
            viewHome.classList.remove('active');
            viewChat.classList.add('active');
            
            // Clean up the DOM and reset the timeline card interior styles silently for next time
            ghost.remove();
            for (let child of cardChildren) {
                child.classList.remove('fade-out-content');
            }
        }, 360); // Perfectly timed just before the 0.38s CSS transition finishes
    } else {
        viewHome.classList.remove('active');
        viewChat.classList.add('active');
    }
}

// Ensure this DOM element declaration sits at the top of your script with the others
const bannerContainer = document.getElementById('bannerContainer');

async function convertSoloToChat() {
    const entry = journalEntries[currentSessionId];
    entry.mode = 'chat';
    entry.title = entry.title;
    mainAppHeaderTitle.innerText = entry.title;

    // SWAP THE COLOR LIVE WHEN BRINGING IN A FRIEND
    //entry.bannerDismissed = false;
    openChatView(currentSessionId);
    updateUserBubbleColor('chat');
    
    // Clear out the share banner instantly from the container
    bannerContainer.innerHTML = '';
    userInput.placeholder = "Let's chat";
    entry.lastEdited = Date.now();
    saveToStorage();

    const typingId = appendTypingIndicator();

    try {
        // 1. Build a clean context array starting with the freshly personalized system prompt
        const historyContext = [
            { role: "system", content: getDynamicSystemPrompt(userData) }
        ];

        // 2. Push all the actual chat history messages on top of it, filtering out any old systems
        entry.history.forEach(msg => {
            if (msg.role !== 'system') {
                historyContext.push(msg);
            }
        });

        // 3. Now send 'historyContext' to your fetch body exactly like before!
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL_NAME, messages: historyContext, max_tokens: 200, temperature: 0.7 })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        let replyText = data?.choices?.[0]?.message?.content?.trim() || "I just read through what you wrote. Want to unpack that a bit?";
        
        appendBubble(replyText, 'friend');
        entry.history.push({ role: "assistant", content: replyText });
        entry.lastEdited = Date.now();
        saveToStorage();

        // 💡 FORCE THE "GO SOLO" BANNER TO APPEAR IMMEDIATELY AFTER THE FIRST RESPONSE
        renderSoloEscapeHatch();

    } catch (e) {
        console.error(e);
        removeTypingIndicator(typingId);
        appendBubble("I'm happy to listen! Let's talk through what you just wrote.", 'friend');
        renderSoloEscapeHatch();
    }
}

function convertChatBackToSolo() {
    const entry = journalEntries[currentSessionId];
    entry.mode = 'solo';

    // SWAP THE COLOR LIVE WHEN REMOVING THE FRIEND
    updateUserBubbleColor('solo');
    
    if (aiResponseTimeout) clearTimeout(aiResponseTimeout);

    //entry.title = entry.title.replace("Processing: ", "");
    mainAppHeaderTitle.innerText = entry.title;
    
    userInput.placeholder = "Pour your thoughts out here...";
    
    // Wipe out the context tag so it clears the conversation track history rule state
    entry.history = entry.history.filter(m => !m.content.includes("[System Notice:"));
    entry.lastEdited = Date.now();
    saveToStorage();

    // Reset the viewport layout
    //entry.bannerDismissed = false;
    openChatView(currentSessionId);
}

function renderSoloEscapeHatch() {
    bannerContainer.innerHTML = '';
    const entry = journalEntries[currentSessionId];
    
    // Initialize a temporary layout property on the entry if it doesn't exist yet
    if (entry.bannerDismissed === undefined) {
        entry.bannerDismissed = false;
    }

    const cleanContent = soloJournalBox.value ? soloJournalBox.value.trim() : '';
    const dynamicParagraphCount = cleanContent ? cleanContent.split('\n\n').length : 0;
    const friendHasResponded = entry.history.some(m => m.role === 'assistant');

    // Determine if the logical conditions are met to show an action option at all
    const shouldShowSoloBanner = (entry.mode === 'solo' && dynamicParagraphCount >= 2);
    const shouldShowChatBanner = (entry.mode === 'chat' && friendHasResponded);

    if (!shouldShowSoloBanner && !shouldShowChatBanner) return;

    // IF DISMISSED: Render a tiny, elegant floating pill to pull it back up later
    if (entry.bannerDismissed) {
        const summonBtn = document.createElement('button');
        summonBtn.className = 'summon-banner-btn';
        summonBtn.innerText = entry.mode === 'solo' ? "Bring in Friend" : "Make Private Notebook";
        summonBtn.addEventListener('click', () => {
            entry.bannerDismissed = false;
            renderSoloEscapeHatch(); // Refresh layout live
        });
        bannerContainer.appendChild(summonBtn);
        return;
    }

    // IF ACTIVE: Render the beautiful liquid glass banner options
    const banner = document.createElement('div');
    banner.id = 'escapeHatchBanner';
    banner.classList.add('upgrade-banner');
    banner.style.margin = '0';
    banner.style.borderRadius = '0';

    if (entry.mode === 'solo') {
        banner.innerHTML = `
            <div class="upgrade-text">
                <h5>Want to process this together?</h5>
                <p>Bring a friend in to read this and talk it out.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
                <button class="upgrade-action-btn" id="upgradeBtn">Share</button>
                <button class="banner-close-btn" id="dismissBannerBtn" aria-label="Dismiss"><span class="material-symbols-rounded">close</span></button>
            </div>
        `;
        bannerContainer.appendChild(banner);
        document.getElementById('upgradeBtn').addEventListener('click', convertSoloToChat);
    } else {
        banner.style.background = '#f4f4f5';
        banner.style.borderLeft = '4px solid #71717a';
        banner.innerHTML = `
            <div class="upgrade-text">
                <h5 style="color: #18181b;">Want some time to think?</h5>
                <p style="color: #71717a;">Turn this chat into a private notebook.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
                <button class="upgrade-action-btn" id="removeBtn">Make Private</button>
                <button class="banner-close-btn" id="dismissBannerBtn" aria-label="Dismiss"><span class="material-symbols-rounded">close</span></button>
            </div>
        `;
        bannerContainer.appendChild(banner);
        document.getElementById('removeBtn').addEventListener('click', convertChatBackToSolo);
    }

    // Wire up the close button event listener
    document.getElementById('dismissBannerBtn').addEventListener('click', () => {
        entry.bannerDismissed = true;
        renderSoloEscapeHatch(); // Flatten instantly to the pill tag
    });
}

function handleInputSubmission() {
    const text = userInput.value.trim();
    if (!text || isAiThinking) return;
    
    appendBubble(text, 'user');
    userInput.value = '';
    
    const entry = journalEntries[currentSessionId];
    entry.history.push({ role: "user", content: text });
    entry.lastEdited = Date.now();
    saveToStorage();
    
    setTimeout(() => { messageArea.scrollTop = messageArea.scrollHeight; }, 30);
    
    triggerAIResponse();
}

async function triggerAIResponse() {
    const entry = journalEntries[currentSessionId];
    if (entry.mode !== 'chat' || !entry.history.length) return;

    // 💡 TURN THE LOCK ON: The AI is now actively processing
    isAiThinking = true;

    const typingId = appendTypingIndicator();
    messageArea.scrollTop = messageArea.scrollHeight;

    const minimumTypingTime = 2500; 
    const maximumTypingTime = 5000;
    const randomizedTypingDuration = Math.floor(Math.random() * (maximumTypingTime - minimumTypingTime + 1)) + minimumTypingTime;

    const typingStartTime = Date.now();

    try {
        // We grab a fresh copy of the history right here, which includes 
        // any extra text messages you sent while the 3-second timer was counting down!

        // 1. Build a clean context array starting with the freshly personalized system prompt
        const historyContext = [
            { role: "system", content: getDynamicSystemPrompt(userData) }
        ];

        // 2. Push all the actual chat history messages on top of it, filtering out any old systems
        entry.history.forEach(msg => {
            if (msg.role !== 'system') {
                historyContext.push(msg);
            }
        });

        // 3. Now send 'historyContext' to your fetch body exactly like before!
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL_NAME, messages: historyContext, max_tokens: 200, temperature: 0.7 })
        });

        const data = await response.json();
        let replyText = data?.choices?.[0]?.message?.content?.trim() || "I'm right here listening.";

        const networkElapsedTime = Date.now() - typingStartTime;
        const remainingTypingDelay = Math.max(0, randomizedTypingDuration - networkElapsedTime);

        setTimeout(() => {
            removeTypingIndicator(typingId);
            
            appendBubble(replyText, 'friend');
            entry.history.push({ role: "assistant", content: replyText });
            saveToStorage();

            const userMessageCount = entry.history.filter(m => m.role === 'user').length;
            if (userMessageCount === 2 || (userMessageCount > 2 && (userMessageCount - 2) % 4 === 0)) {
                generateAutoTitle(currentSessionId);
            }
            
            renderSoloEscapeHatch();
            messageArea.scrollTop = messageArea.scrollHeight;
            
            // 💡 UNLOCK THE DOOR: The friend is done speaking and ready for new messages
            isAiThinking = false;

            // 💡 MINING TRIGGER: Let the AI quietly analyze the chat for new memories in the background
            mineNewMemoriesFromChat(entry.history);
            
        }, remainingTypingDelay);

    } catch (e) {
        console.error(e);
        
        const networkElapsedTime = Date.now() - typingStartTime;
        const remainingTypingDelay = Math.max(0, randomizedTypingDuration - networkElapsedTime);

        setTimeout(() => {
            removeTypingIndicator(typingId);
            appendBubble("I'm right here listening. Let's talk through what you just wrote.", 'friend');
            renderSoloEscapeHatch();
            
            // 💡 UNLOCK ON ERROR TOO
            isAiThinking = false;
        }, remainingTypingDelay);
    }
}

async function generateAutoTitle(sessionId) {
    const entry = journalEntries[sessionId];
    if (!entry || !entry.history || entry.history.length < 2) return;

    const historyCopy = [...entry.history];
    historyCopy.push({
        role: "user",
        content: "Provide a 1 to 5 word title summarizing our conversation or journal entry so far. Focus on the main topic. Return ONLY the title text. Do not use quotes, punctuation, or full sentences. You must write your responses exclusively in English."
    });

    try {
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL_NAME, messages: historyCopy, max_tokens: 15, temperature: 0.5 })
        });

        const data = await response.json();
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            let aiTitle = data.choices[0].message.content.trim().replace(/^["']|["']$/g, ''); 
            
            // Save the new title to memory
            entry.title = aiTitle;
            saveToStorage();
            
            // 💡 Update the UI header instantly if the user is still looking at this entry
            if (sessionId === currentSessionId) {
                // If it's chat mode, keep the prefix, otherwise use the raw title
                //mainAppHeaderTitle.innerText = entry.mode === 'chat' ? "Processing: " + aiTitle : aiTitle;
                mainAppHeaderTitle.innerText = aiTitle;
            }
        }
    } catch (e) {
        console.error("Auto-titling failed:", e);
    }
}

async function mineNewMemoriesFromChat(entryHistory) {
    // Safety check: only extract if there's enough text to actually analyze
    const meaningfulMessages = entryHistory.filter(m => m.role !== 'system');
    if (meaningfulMessages.length < 3) return;

    // Create a specialized utility prompt for the memory parsing engine
    const memoryMiningContext = [
        {
            role: "system",
            content: `You are a background data synchronization engine. Your job is to analyze the conversation history between a user and their AI friend, and extract core, permanent life facts about the user that should be remembered across future chats.
            
            EXTRACT FACTS LIKE:
            - Ongoing projects, work situations, or specific goals they are tackling.
            - Names of specific people in their life (coworkers, friends, family) and their relationship to them.
            - Clear preferences, habits, routines, or recurring life events discussed.

            CRITICAL RULES:
            1. Extract ONLY concrete facts or current life details. Do NOT extract fleeting emotional states (e.g., do NOT extract "User felt tired on Monday").
            2. Keep each extracted fact extremely concise (e.g., "Working on a major technological transition at work in May", "Has a friend named Alex who plays guitar").
            3. Return the facts as a clean JSON string array format ONLY. Example output format: ["Fact 1", "Fact 2"]. If no new concrete long-term facts are found, return an empty array: []`
        },
        ...meaningfulMessages // Pass the actual dialogue thread
    ];

    try {
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: MODEL_NAME, messages: memoryMiningContext, max_tokens: 150, temperature: 0.2 }) // Low temperature for factual accuracy
        });

        const data = await response.json();
        const rawContent = data?.choices?.[0]?.message?.content?.trim();

        if (rawContent) {
            // Parse out the array of facts returned by the AI
            console.log("Raw extracted facts string:", rawContent);
            const newExtractedFacts = JSON.parse(rawContent);

            if (Array.isArray(newExtractedFacts) && newExtractedFacts.length > 0) {
                let memoriesChanged = false;

                newExtractedFacts.forEach(fact => {
                    // Check if we already have this fact recorded to prevent duplication clutter
                    const isDuplicate = userData.learnedMemories.some(existingFact => 
                        existingFact.toLowerCase().includes(fact.toLowerCase().slice(0, 10))
                    );

                    if (!isDuplicate) {
                        userData.learnedMemories.push(fact);
                        memoriesChanged = true;
                    }
                });

                if (memoriesChanged) {
                    // Keep the cross-chat memory bank optimized to the top 15 most relevant facts
                    if (userData.learnedMemories.length > 15) {
                        userData.learnedMemories.shift(); // Remove the oldest memory if pool overflows
                    }
                    // Save permanently to the browser local storage
                    localStorage.setItem('journalUserProfile', JSON.stringify(userData));
                }
            }
        }
    } catch (e) {
        console.error("Memory extraction background loop failed:", e);
    }
}

function closeChatView() {
    currentSessionId = null;
    viewChat.classList.remove('active');
    viewHome.classList.add('active');
    
    // Clear out navigation states safely
    backBtn.style.display = "none";
    deleteBtn.style.display = "none";
    fabBtn.style.display = "flex";
    mainAppHeaderTitle.innerText = "Selah";
    
    renderTimeline();
}

function deleteCurrentEntry() {
    if (!currentSessionId) return;
    if (confirm("Are you sure you want to discard this entry?")) {
        delete journalEntries[currentSessionId];
        saveToStorage();
        closeChatView();
    }
}

function appendBubble(text, sender) {
    const bubble = document.createElement('div');
    bubble.classList.add('bubble', sender);
    bubble.innerText = text;
    messageArea.appendChild(bubble);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function updateUserBubbleColor(mode) {
    const chatContainer = document.getElementById('viewChat');
    
    if (mode === 'chat') {
        chatContainer.style.setProperty('--user-bubble', 'var(--accent-purple)');
    } else {
        chatContainer.style.setProperty('--user-bubble', 'var(--text-dark)'); 
    }
}

function appendTypingIndicator() {
    const id = 'typing_' + Date.now();
    const container = document.createElement('div');
    container.classList.add('typing-indicator');
    container.id = id;
    container.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    messageArea.appendChild(container);
    messageArea.scrollTop = messageArea.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) indicator.remove();
}

function saveToStorage() {
    localStorage.setItem('selah_journal_db', JSON.stringify(journalEntries));
}


// Onboarding State Tracking Variable Parameters
let currentObStep = 0;
const totalObSteps = 3;
let temporaryOnboardingAnswers = {
    name: "",
    pronouns: "",
    hobbies: [],
    bioSummary: ""
};

// DOM Node Element Hooks
const onboardingWizard = document.getElementById('onboardingWizard');
const onboardingScreenBody = document.getElementById('onboardingScreenBody');
const obBackBtn = document.getElementById('obBackBtn');
const obNextBtn = document.getElementById('obNextBtn');

// Core List of Tag Interactivity Options
const presetHobbyOptions = [
  "Arts/Crafts",
  "Coding/Tech",
  "Cooking/Food",
  "Digital/Online Content",
  "Fitness/Sports",
  "Gaming/Video Games",
  "Gardening/Plants",
  "Learning New Things",
  "Movies/Shows/TV",
  "Music/Instruments",
  "Nature/Outdoors",
  "Pets/Animals",
  "Photography",
  "Reading/Podcasts",
  "Socializing/Community",
  "Traveling/Exploring",
  "Writing"
];


// Define individual views structurally as layouts
const onboardingScreens = [
    {
        title: "Hey there!",
        subtitle: "What's your name?",
        render: () => `
            <h2 style="font-size: 24px; font-weight: 700; margin-bottom: 6px; color: var(--text-dark);">${onboardingScreens[0].title}</h2>
            <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 20px;">${onboardingScreens[0].subtitle}</p>
            <input type="text" id="obNameInput" placeholder="First name or nickname" value="${temporaryOnboardingAnswers.name}" autocomplete="off" style="
                width: 100%; padding: 14px 18px; border-radius: 16px; border: 1px solid var(--glass-border);
                background: rgba(255,255,255,0.5); font-size: 16px; outline: none; color: var(--text-dark);
            ">
        `,
        save: () => {
            const val = document.getElementById('obNameInput').value.trim();
            temporaryOnboardingAnswers.name = val || "Friend";
            return true;
        }
    },
    {
        title: "Tell me about yourself",
        subtitle: "Choose some things you love doing",
        render: () => {
            let html = `
                <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 6px; color: var(--text-dark);">${onboardingScreens[1].title}</h2>
                <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">${onboardingScreens[1].subtitle}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; overflow-y: auto;">
            `;
            presetHobbyOptions.forEach(hobby => {
                const isActive = temporaryOnboardingAnswers.hobbies.includes(hobby);
                const bg = isActive ? 'var(--accent-purple)' : 'rgba(255,255,255,0.4)';
                const color = isActive ? 'white' : 'var(--text-dark)';
                const bdr = isActive ? '1px solid var(--accent-purple)' : '1px solid var(--glass-border)';
                html += `
                    <button class="ob-hobby-pill" data-value="${hobby}" style="
                        padding: 10px 16px; border-radius: 14px; border: ${bdr}; background: ${bg};
                        color: ${color}; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;
                    ">${hobby}</button>
                `;
            });
            html += `</div>`;
            return html;
        },
        initEvents: () => {
            // Add click toggles to the newly rendered hobby buttons
            document.querySelectorAll('.ob-hobby-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.dataset.value;
                    if (temporaryOnboardingAnswers.hobbies.includes(value)) {
                        temporaryOnboardingAnswers.hobbies = temporaryOnboardingAnswers.hobbies.filter(h => h !== value);
                        btn.style.background = 'rgba(255,255,255,0.4)';
                        btn.style.color = 'var(--text-dark)';
                        btn.style.border = '1px solid var(--glass-border)';
                    } else {
                        temporaryOnboardingAnswers.hobbies.push(value);
                        btn.style.background = 'var(--accent-purple)';
                        btn.style.color = 'white';
                        btn.style.border = '1px solid var(--accent-purple)';
                    }
                });
            });
        },
        save: () => true // State tracks actively on button presses, safely return true
    },
    {
        title: "One last thing...",
        subtitle: "Tell me a little about yourself! What do you do? What are you passionate about? This will help me be a better friend to you.",
        render: () => `
            <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 6px; color: var(--text-dark);">${onboardingScreens[2].title}</h2>
            <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px;">${onboardingScreens[2].subtitle}</p>
            <textarea id="obBioInput" placeholder="Your job, hobbies, passions, values, school, family..." style="
                width: 100%; height: 120px; padding: 14px; border-radius: 16px; border: 1px solid var(--glass-border);
                background: rgba(255,255,255,0.5); font-size: 15px; outline: none; color: var(--text-dark);
                resize: none; line-height: 1.4; font-family: inherit;
            ">${temporaryOnboardingAnswers.bioSummary}</textarea>
        `,
        save: () => {
            temporaryOnboardingAnswers.bioSummary = document.getElementById('obBioInput').value.trim();
            return true;
        }
    }
];

// Structural UI Router Renderer
function renderActiveOnboardingScreen() {
    const currentScreen = onboardingScreens[currentObStep];
    onboardingScreenBody.innerHTML = currentScreen.render();
    
    // Trigger structural click binders if current frame requires setup actions
    if (currentScreen.initEvents) currentScreen.initEvents();

    // Toggle footer back actions visibility constraints
    obBackBtn.style.visibility = currentObStep === 0 ? 'hidden' : 'visible';
    
    // Toggle action naming thresholds
    obNextBtn.innerText = currentObStep === totalObSteps - 1 ? 'Finish' : 'Next';

    // Update the visual step tracker header rules
    const dots = document.querySelectorAll('.ob-step-dot');
    dots.forEach((dot, index) => {
        if (index <= currentObStep) {
            dot.style.background = 'var(--accent-purple)';
        } else {
            dot.style.background = 'rgba(0,0,0,0.1)';
        }
    });
}

// Global Application Core Bootstrap Hook Controller
function checkAppAuthInitStatus() {
    const baselineProfile = localStorage.getItem('journalUserProfile');
    
    if (baselineProfile) {
        // User already setup! Clear layout layers and jump inside timeline directly
        onboardingWizard.style.display = 'none';
        userData = JSON.parse(baselineProfile);
        renderTimeline();
    } else {
        // Launch onboarding framework loop
        onboardingWizard.style.display = 'flex';
        renderActiveOnboardingScreen();
    }
}

// Action Listeners wiring setup
obNextBtn.addEventListener('click', () => {
    const currentScreen = onboardingScreens[currentObStep];
    
    // Execute field validations and variable commits
    if (currentScreen.save()) {
        if (currentObStep < totalObSteps - 1) {
            currentObStep++;
            renderActiveOnboardingScreen();
        } else {
            // Final step finished! Package database fields
            userData = {
                name: temporaryOnboardingAnswers.name,
                pronouns: "them/them", // Default placeholder
                bioSummary: temporaryOnboardingAnswers.bioSummary || "Focused on writing down authentic thoughts.",
                hobbies: temporaryOnboardingAnswers.hobbies.length > 0 ? temporaryOnboardingAnswers.hobbies : ["Reflection"],
                values: "Values personal tracking, journaling, and deep mental focus.",
                learnedMemories: [] 
            };

            // Commit permanently to the browser client database
            localStorage.setItem('journalUserProfile', JSON.stringify(userData));
            
            // Slide onboarding away smoothly with a fade out transition animation
            onboardingWizard.style.transition = 'opacity 0.4s ease';
            onboardingWizard.style.opacity = '0';
            setTimeout(() => {
                onboardingWizard.style.display = 'none';
                renderTimeline(); // Refresh main app timeline grid cards instantly
            }, 400);
        }
    }
});

obBackBtn.addEventListener('click', () => {
    if (currentObStep > 0) {
        currentObStep--;
        renderActiveOnboardingScreen();
    }
});

// Run verification loop on document launch load runtime bounds
document.addEventListener('DOMContentLoaded', () => {
    checkAppAuthInitStatus();
});


initApp();