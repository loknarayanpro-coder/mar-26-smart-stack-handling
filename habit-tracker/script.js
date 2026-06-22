// Handle Tab Switching
function switchTab(tabId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // Show selected screen
    if (tabId === 'dashboard') {
        document.getElementById('dashboard-screen').classList.add('active');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
    } else if (tabId === 'add') {
        document.getElementById('add-screen').classList.add('active');
    } else if (tabId === 'settings') {
        document.getElementById('settings-screen').classList.add('active');
        document.querySelectorAll('.nav-item')[3].classList.add('active');
    }
}

// Function to return to dashboard after adding
function showDashboard() {
    switchTab('dashboard');
    
    // Simulate adding a new habit (show a quick alert or animation)
    const btn = document.querySelector('.primary-btn');
    const originalText = btn.innerText;
    btn.innerText = "Added Successfully!";
    btn.style.backgroundColor = "#10b981";
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.backgroundColor = "var(--primary)";
    }, 2000);
}

// Handle Checking Off Habits
function toggleHabit(element) {
    element.classList.toggle('completed');
    element.classList.toggle('pending');
    updateProgress();
}

// Update the circular progress ring
function updateProgress() {
    const total = document.querySelectorAll('.habit-card').length;
    const completed = document.querySelectorAll('.habit-card.completed').length;
    
    const percentage = Math.round((completed / total) * 100);
    
    // Update text
    document.querySelector('.progress-info p').innerText = `${completed} of ${total} completed`;
    document.querySelector('.percentage').innerText = `${percentage}%`;
    
    // Update circle SVG
    const circle = document.querySelector('.circle');
    // Dasharray is "percentage, 100" to create the pie chart effect
    circle.setAttribute('stroke-dasharray', `${percentage}, 100`);
}

// Interactive Category Selection
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Interactive Frequency Selection
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

// Interactive Settings Toggles
document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
    });
});

// Initialize Progress on load
window.onload = () => {
    updateProgress();
};
