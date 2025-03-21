const MODES = ['stable', 'story', 'quiz', 'language', 'doubt'];
let currentMode = 'stable';
let currentIndex = 0;

// Content Databases
const storyDB = [
    "In 2035, AR robots became teachers. Sarcos was the most advanced AI educator!",
    "Sarcos could project holographic lessons. Students learned about space through 3D simulations!",
    "The robot's knowledge database connected to all human knowledge through quantum networks!"
];

const quizDB = [{
    question: "What's the capital of France?",
    options: ["London", "Paris", "Berlin"],
    answer: 1
}];

const languageDB = {
    french: ["Hello = Bonjour", "Goodbye = Au revoir", "Thank you = Merci"],
    german: ["Hello = Hallo", "Goodbye = Auf Wiedersehen", "Thank you = Danke"]
};

// Mode Handlers
function setMode(mode) {
    currentMode = mode;
    currentIndex = 0;
    document.getElementById('mode').play();
    
    // Eye animations
    const eyes = document.querySelectorAll('.eye');
    eyes.forEach(eye => {
        eye[mode === 'stable' ? 'setAttribute' : 'removeAttribute'](
            'animation', 
            'property: opacity; from:1; to:0.2; dur:1000; loop:true'
        );
    });

    updateDisplay();
}

async function updateDisplay() {
    const display = document.getElementById('display');
    
    switch(currentMode) {
        case 'stable':
            display.setAttribute('value', "Stable Mode\n^^");
            break;
            
        case 'story':
            display.setAttribute('value', storyDB[currentIndex % storyDB.length]);
            break;
            
        case 'quiz':
            const q = quizDB[currentIndex % quizDB.length];
            display.setAttribute('value', 
                `${q.question}\n${q.options.map((o,i) => `${i+1}. ${o}`).join('\n')}`
            );
            break;
            
        case 'language':
            const lang = currentIndex % 2 === 0 ? 'french' : 'german';
            display.setAttribute('value', 
                `${lang.toUpperCase()}:\n${languageDB[lang].join('\n')}`
            );
            break;
            
        case 'doubt':
            display.setAttribute('value', "Ask your question...");
            break;
    }
}

// Voice Control
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.lang = 'en-US';

recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length-1][0].transcript.toLowerCase();
    
    if(currentMode === 'stable') return;
    
    if(transcript.includes('mode')) {
        const mode = transcript.replace('mode', '').trim();
        if(MODES.includes(mode)) setMode(mode);
        return;
    }
    
    switch(currentMode) {
        case 'story':
        case 'language':
            currentIndex++;
            updateDisplay();
            break;
            
        case 'quiz':
            const answer = parseInt(transcript) - 1;
            const correct = answer === quizDB[currentIndex % quizDB.length].answer;
            showResult(correct ? "Correct! 🎉" : "Wrong! ❌", correct);
            if(correct) currentIndex++;
            break;
            
        case 'doubt':
            handleQuestion(transcript);
            break;
    }
};

// Question Answering System
async function handleQuestion(question) {
    try {
        // Try DuckDuckGo
        const ddgResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(question)}&format=json`);
        const ddgData = await ddgResponse.json();
        
        if(ddgData.AbstractText) {
            showAnswer(ddgData.AbstractText);
        } else {
            // Try Wikipedia
            const wikiResponse = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${question}&format=json`);
            const wikiData = await wikiResponse.json();
            const snippet = wikiData.query.search[0]?.snippet.replace(/<[^>]+>/g, '');
            showAnswer(snippet || "No answer found");
        }
    } catch {
        showAnswer("Connection error!");
    }
}

function showAnswer(text) {
    const display = document.getElementById('display');
    display.setAttribute('value', text);
    document.getElementById(text.includes('!') ? 'alert' : 'success').play();
}

// Initialize
setMode('stable');
recognition.start();