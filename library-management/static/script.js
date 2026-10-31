// Web Speech API Voice Search
function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceStatus = document.getElementById('voiceStatus');
    const searchInput = document.getElementById('searchInput');
    const micBtn = document.getElementById('micBtn');

    if (!SpeechRecognition) {
        alert("Web Speech API is not supported in this browser. Please open in Google Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = function () {
        if (voiceStatus) {
            voiceStatus.innerText = "Listening...";
            voiceStatus.style.display = "block";
        }
        if (micBtn) micBtn.classList.add('listening');
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        if (voiceStatus) {
            voiceStatus.innerText = "Searching for " + transcript + "...";
        }
        if (searchInput) {
            searchInput.value = transcript;
        }
        setTimeout(() => {
            const form = document.getElementById('searchForm');
            if (form) form.submit();
        }, 800);
    };

    recognition.onerror = function (event) {
        if (voiceStatus) {
            voiceStatus.innerText = "Voice error: " + event.error;
        }
        if (micBtn) micBtn.classList.remove('listening');
    };

    recognition.onend = function () {
        if (micBtn) micBtn.classList.remove('listening');
    };

    recognition.start();
}

// Dynamic Recommendation Fetch
function fetchRecommendations() {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    const cat = select.value;
    fetch('/recommendations?category=' + encodeURIComponent(cat))
        .then(res => res.json())
        .then(items => {
            const grid = document.getElementById('recGrid');
            if (!grid) return;
            grid.innerHTML = '';
            items.forEach(item => {
                const b = item.book;
                const reason = item.reason;
                const isAvail = b.available_quantity > 0;
                grid.innerHTML += `
                    <div class="book-card">
                        <div>
                            <span class="category-tag">${b.category}</span>
                            <h3>${b.title}</h3>
                            <p class="author">By ${b.author}</p>
                            <p style="font-size: 0.75rem; color: #059669; margin: 0.3rem 0;">✨ ${reason}</p>
                            <div class="meta">
                                <span>Year: ${b.year}</span>
                                <span>Available: ${b.available_quantity}</span>
                            </div>
                        </div>
                        <div class="actions">
                            <span style="font-size: 0.8rem; font-weight: 600; color: ${isAvail ? '#059669' : '#dc2626'};">
                                ${isAvail ? 'In Stock' : 'Out of Stock'}
                            </span>
                            <form action="/borrow/${b.id}" method="POST" style="margin: 0;">
                                <button type="submit" class="btn-borrow" ${!isAvail ? 'disabled' : ''}>
                                    Borrow Book
                                </button>
                            </form>
                        </div>
                    </div>
                `;
            });
        })
        .catch(err => console.error("Error loading recommendations", err));
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRecommendations();
});
