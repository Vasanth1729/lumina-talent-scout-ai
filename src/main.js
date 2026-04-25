// Mock Database of Candidates
const candidatesDB = [
    {
        id: 1,
        name: "Sarah Chen",
        role: "Senior Full Stack Engineer",
        skills: ["React", "TypeScript", "Node.js", "AWS", "GraphQL"],
        experience: 8,
        bio: "Passionate about building scalable cloud architectures and intuitive user interfaces. Former Lead at TechNova.",
        lastActive: "2 days ago"
    },
    {
        id: 2,
        name: "Marcus Rodriguez",
        role: "Backend Architect",
        skills: ["Go", "Kubernetes", "PostgreSQL", "Redis", "Distributed Systems"],
        experience: 10,
        bio: "Infrastructure enthusiast with a focus on high-concurrency systems and microservices orchestration.",
        lastActive: "Active now"
    },
    {
        id: 3,
        name: "Elena Petrova",
        role: "Senior Frontend Engineer",
        skills: ["React", "TypeScript", "Vue", "D3.js", "TailwindCSS", "Animations"],
        experience: 7,
        bio: "Specializing in high-performance data visualization and delightful user experiences. Expert in React and TailwindCSS dashboards.",
        lastActive: "Active now"
    },
    {
        id: 4,
        name: "James Wilson",
        role: "Software Engineer",
        skills: ["Python", "Django", "React", "Docker", "Machine Learning"],
        experience: 4,
        bio: "Full stack developer with a strong interest in AI/ML integrations within web applications.",
        lastActive: "1 week ago"
    },
    {
        id: 5,
        name: "Aisha Khan",
        role: "Product-Focused Engineer",
        skills: ["Next.js", "React", "Firebase", "Stripe", "UI/UX Design"],
        experience: 6,
        bio: "Bridging the gap between engineering and product. Expert in rapid prototyping and MVP development.",
        lastActive: "3 hours ago"
    },
    {
        id: 6,
        name: "David Smith",
        role: "DevOps Engineer",
        skills: ["AWS", "Terraform", "CI/CD", "Docker", "Monitoring"],
        experience: 7,
        bio: "Automation enthusiast focusing on cloud infrastructure efficiency and developer productivity.",
        lastActive: "1 day ago"
    },
    {
        id: 7,
        name: "Linda Wu",
        role: "Data Engineer",
        skills: ["Spark", "Python", "SQL", "Airflow", "Data Warehousing"],
        experience: 6,
        bio: "Building robust data pipelines and optimizing large-scale data processing workflows.",
        lastActive: "4 days ago"
    },
    {
        id: 8,
        name: "Kevin Lee",
        role: "Security Engineer",
        skills: ["Pentesting", "Python", "Cloud Security", "OWASP", "SIEM"],
        experience: 9,
        bio: "Dedicated to securing applications and infrastructure against modern cyber threats.",
        lastActive: "Active now"
    },
    {
        id: 9,
        name: "Rachel Green",
        role: "UI/UX Developer",
        skills: ["React", "Figma", "CSS", "Storybook", "Accessibility"],
        experience: 5,
        bio: "Creating accessible and beautiful user interfaces with a focus on component-driven development.",
        lastActive: "2 days ago"
    },
    {
        id: 10,
        name: "Tom Harris",
        role: "ML Engineer",
        skills: ["PyTorch", "Python", "NLP", "Computer Vision", "Scikit-Learn"],
        experience: 4,
        bio: "Implementing production-ready machine learning models for complex business problems.",
        lastActive: "1 week ago"
    },
    {
        id: 11,
        name: "Sonia Gupta",
        role: "Mobile Developer",
        skills: ["React Native", "TypeScript", "Firebase", "iOS", "Android"],
        experience: 6,
        bio: "Cross-platform mobile expert with several successful apps in the App Store and Play Store.",
        lastActive: "5 hours ago"
    },
    {
        id: 12,
        name: "Alex Johnson",
        role: "Reliability Engineer",
        skills: ["Go", "SRE", "Linux", "Prometheus", "Service Mesh"],
        experience: 11,
        bio: "Ensuring high availability and reliability for global-scale microservices platforms.",
        lastActive: "Active now"
    }
];

// UI Elements
const jdText = document.getElementById('jdText');
const startBtn = document.getElementById('startBtn');
const logContainer = document.getElementById('logContainer');
const resultsArea = document.getElementById('resultsArea');
const agentStatus = document.getElementById('agentStatus');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const chatHistory = document.getElementById('chatHistory');
const modalTitle = document.getElementById('modalTitle');

// State
let isScouting = false;

// Helpers
const addLog = (msg, type = 'info') => {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-msg ${type}">${msg}</span>
    `;
    logContainer.prepend(entry);
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Simple seed-based pseudo-random number generator for stable scores
const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const getActivityScore = (lastActive) => {
    if (lastActive === "Active now") return 100;
    if (lastActive.includes("hours")) return 90;
    if (lastActive.includes("days")) {
        const days = parseInt(lastActive);
        return Math.max(0, 80 - (days * 10));
    }
    if (lastActive.includes("week")) return 40;
    return 20;
};

const getExperienceRequirement = (jd) => {
    const text = jd.toLowerCase();
    // Look for patterns like "5+ years", "5 years", "minimum 5 years", "at least 5 years"
    const expPatterns = [
        /(\d+)\s*(?:\+|plus)?\s*years?/i,
        /minimum\s*(?:of\s*)?(\d+)\s*years?/i,
        /at\s*least\s*(\d+)\s*years?/i,
        /(\d+)\s*years?\s*(?:of\s*)?experience/i
    ];

    for (const pattern of expPatterns) {
        const match = text.match(pattern);
        if (match) {
            return parseInt(match[1]);
        }
    }
    return 0; // Default if not found
};

function resetUIState() {
    isScouting = false;
    startBtn.disabled = false;
    jdText.disabled = false;
    agentStatus.style.display = 'none';
}

// Core Logic
async function runScoutingAgent() {
    const jd = jdText.value.trim();
    if (!jd) {
        addLog("Error: Please provide a Job Description.", "danger");
        return;
    }

    try {
        isScouting = true;
        startBtn.disabled = true;
        jdText.disabled = true;

        agentStatus.style.display = 'flex';
        resultsArea.innerHTML = '<div class="empty-state"><h3>Agent is scouting...</h3><div class="loader"></div></div>';

        addLog("Initializing Talent Agent...", "process");
        await delay(800);

        // 1. JD Parsing
        addLog("Parsing Job Description for semantic requirements...", "process");
        const skillKeywords = ["react", "typescript", "node", "aws", "python", "go", "kubernetes", "frontend", "backend", "full stack", "distributed", "ml", "ai", "design", "tailwindcss", "vue", "graphql", "d3.js", "visualization", "dashboard", "docker", "spark", "figma", "postgresql", "redis", "next.js", "firebase", "security", "devops"];
        const extractedKeywords = jd.toLowerCase().match(new RegExp(`\\b(${skillKeywords.join('|').replace('.', '\\.')})\\b`, 'g')) || [];
        const uniqueKeywords = [...new Set(extractedKeywords)];
        addLog(`Extracted Skills: ${uniqueKeywords.join(', ')}`, "success");
        
        const minExp = getExperienceRequirement(jd);
        addLog(`Detected Experience Requirement: ${minExp}+ years`, "info");
        await delay(1000);

        // 2. Candidate Discovery & Matching
        addLog("Scanning candidate database and professional networks...", "process");
        await delay(1500);

        // Filter by extracted experience
        const filteredDB = candidatesDB.filter(cand => cand.experience >= minExp);

        if (filteredDB.length === 0) {
            addLog(`No candidates found with at least ${minExp} years of experience.`, "warning");
            resultsArea.innerHTML = `<div class="empty-state"><h3>No exact matches found</h3><p>Try adjusting the Job Description requirements.</p></div>`;
            resetUIState();
            return;
        }

        const matches = filteredDB.map(cand => {
            let matchScore = 0;

            // A. Skill Match (60%)
            const matchingSkills = cand.skills.filter(s => uniqueKeywords.includes(s.toLowerCase()));
            if (uniqueKeywords.length > 0) {
                const skillRatio = matchingSkills.length / Math.min(uniqueKeywords.length, 5); 
                matchScore += Math.min(skillRatio * 60, 60);
            }

            // B. Role Match (15%)
            const jdLower = jd.toLowerCase();
            const candRoleLower = cand.role.toLowerCase();
            if (jdLower.includes(candRoleLower.split(' ')[0])) matchScore += 15;

            // C. Experience Match (15%)
            if (cand.experience >= minExp) matchScore += 15;
            else if (cand.experience >= minExp - 2) matchScore += 7;

            // D. Bio Match (10%)
            const bioMatchingSkills = skillKeywords.filter(s => cand.bio.toLowerCase().includes(s) && jdLower.includes(s));
            if (bioMatchingSkills.length > 0) matchScore += 10;

            matchScore = Math.min(Math.round(matchScore), 100);

            return {
                ...cand,
                matchScore,
                matchingSkills,
                reasoning: `Matched based on ${matchingSkills.length} key skills (${matchingSkills.join(', ')}) and ${cand.experience} years of experience. Bio alignment on ${bioMatchingSkills.slice(0, 2).join(', ')}.`
            };
        }).sort((a, b) => b.matchScore - a.matchScore);

        addLog(`Found ${matches.length} potential matches. Initiating autonomous outreach...`, "success");
        await delay(1200);

        // 3. Conversational Outreach Simulation
        addLog("Agent is engaging candidates via Lumina Chat...", "process");

        const finalResults = [];
        for (const match of matches) {
            addLog(`Contacting ${match.name}...`, "info");
            const interestData = await simulateCandidateEngagement(match, jd);
            finalResults.push({ ...match, ...interestData });
            await delay(500);
        }

        addLog("Assessment complete. Shortlist generated.", "success");
        renderResults(finalResults);
    } catch (error) {
        addLog(`System Error: ${error.message}`, "danger");
        resultsArea.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>Please try again or refresh the page.</p></div>`;
    } finally {
        resetUIState();
    }
}

async function simulateCandidateEngagement(candidate, jd) {
    // Determine interest based on stable factors
    const activityWeight = getActivityScore(candidate.lastActive); // 0-100
    const profileHash = getHash(candidate.name) % 100; // 0-99 stable factor

    // Interest score = 40% Activity + 60% Profile/Stable Factor
    const interestScore = Math.round((activityWeight * 0.4) + (profileHash * 0.6));

    const messages = [
        { role: 'ai', text: `Hi ${candidate.name}! I'm Lumina, an AI talent partner. I saw your profile and your work with ${candidate.skills[0]} is impressive. Are you open to discussing a new role that aligns with your background?` },
        { role: 'candidate', text: interestScore > 75 ? `Hi Lumina, thanks for reaching out! I'm actually curious about new opportunities. I saw the post for ${jd.split(' ').slice(0, 3).join(' ')}... What's the stack?` : `Hello. I'm somewhat settled at the moment, but tell me more.` },
        { role: 'ai', text: `The role involves ${jd.length > 120 ? jd.substring(0, 120) + '...' : jd} Based on your activity, you seem like a great fit.` },
        { role: 'candidate', text: interestScore > 85 ? `That sounds exactly like what I'm looking for. Let's chat tomorrow.` : interestScore > 60 ? `Interesting. Can you send over a more detailed JD?` : `I see. I'll keep it in mind if my situation changes.` }
    ];

    return {
        interestScore,
        interactionSummary: interestScore > 80 ? "Highly interested, requested immediate follow-up." : interestScore > 50 ? "Interested, requested more details." : "Passive, likely needs more persuasion.",
        chatHistory: messages
    };
}

function renderResults(results) {
    resultsArea.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'candidate-grid';

    results.forEach(res => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <div class="card-header">
                <div class="candidate-info">
                    <h3>${res.name}</h3>
                    <div class="candidate-role">${res.role} • ${res.experience} yrs</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Last active: ${res.lastActive}</div>
                </div>
                <div class="scores">
                    <div class="score-box">
                        <span class="score-value" style="color: ${getScoreColor(res.matchScore)}">${res.matchScore}%</span>
                        <span class="score-label">Match</span>
                    </div>
                    <div class="score-box">
                        <span class="score-value" style="color: ${getScoreColor(res.interestScore)}">${res.interestScore}%</span>
                        <span class="score-label">Interest</span>
                    </div>
                </div>
            </div>
            <div class="match-reasoning">
                <p style="margin-bottom: 0.5rem; font-style: italic; color: var(--text-muted); font-size: 0.8rem;">"${res.bio}"</p>
                <p>${res.reasoning}</p>
                <div class="tags">
                    ${res.matchingSkills.map(s => `<span class="tag">${s}</span>`).join('')}
                </div>
            </div>
            <div class="interest-interaction">
                <div class="interaction-summary">${res.interactionSummary}</div>
                <button class="btn-view-chat" data-id="${res.id}" style="margin-top: 0.75rem; background: none; border: 1px solid var(--accent-secondary); color: var(--accent-secondary); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">View Interaction</button>
            </div>
        `;

        card.querySelector('.btn-view-chat').addEventListener('click', () => showChat(res));
        grid.appendChild(card);
    });

    resultsArea.appendChild(grid);
}

function getScoreColor(score) {
    if (score > 80) return 'var(--success)';
    if (score > 50) return 'var(--warning)';
    return 'var(--danger)';
}

function showChat(candidate) {
    modalTitle.innerText = `Outreach with ${candidate.name}`;
    chatHistory.innerHTML = '';
    candidate.chatHistory.forEach(msg => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble bubble-${msg.role}`;
        bubble.innerText = msg.text;
        chatHistory.appendChild(bubble);
    });
    modalOverlay.style.display = 'flex';
}

// Event Listeners
startBtn.addEventListener('click', runScoutingAgent);
closeModal.addEventListener('click', () => modalOverlay.style.display = 'none');
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
});

// Initial Log
addLog("Lumina AI System v1.0.4 initialized.", "info");
addLog("Connected to Global Talent Index.", "info");
