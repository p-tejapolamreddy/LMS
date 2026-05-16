// Global Chart instance
let issuesChart = null;

// Load dashboard data
async function loadDashboard() {
    try {
        const token = getToken();
        
        // Fetch all data
        const [booksRes, issuesRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/books`, { headers: { 'x-auth-token': token } }),
            fetch(`${API_URL}/issues`, { headers: { 'x-auth-token': token } }),
            fetch(`${API_URL}/users`, { headers: { 'x-auth-token': token } })
        ]);

        const books = await booksRes.json();
        const issues = await issuesRes.json();
        const users = await usersRes.json();

        // 1. Update Top Stats
        const totalBooks = books.length;
        const issuedBooksCount = issues.filter(i => i.status === 'issued').length;
        const totalUsers = users.length;
        const totalFines = issues.reduce((sum, issue) => sum + (issue.fine || 0), 0);

        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('issuedBooks').textContent = issuedBooksCount;
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalFines').textContent = `₹${totalFines}`;

        // 2. Prepare & Render Chart
        renderChart(issues);

        // 3. Load recent issues (last 5)
        const recentIssues = issues.slice(0, 5);
        displayRecentIssues(recentIssues);

        // 4. Load overdue books
        const overdueRes = await fetch(`${API_URL}/issues/overdue`, {
            headers: { 'x-auth-token': token }
        });
        const overdue = await overdueRes.json();
        displayOverdueBooks(overdue);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showMessage('Error loading dashboard data', 'error');
    }
}

function renderChart(issues) {
    const ctx = document.getElementById('issuesChart');
    if (!ctx) return;

    window.lastChartData = issues;

    // Process data for last 7 days
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const dataPoints = last7Days.map(date => {
        return issues.filter(issue => issue.issueDate.startsWith(date)).length;
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (issuesChart) {
        issuesChart.destroy();
    }

    issuesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
            datasets: [{
                label: 'Books Issued',
                data: dataPoints,
                backgroundColor: '#2563eb',
                borderRadius: 4,
                hoverBackgroundColor: '#1d4ed8',
                barPercentage: 0.6
            }]
        },
        options: {
            animation: {
                duration: 500,
                easing: 'easeOutQuart'
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f1f5f9' : '#0f172a',
                    bodyColor: isDark ? '#f1f5f9' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: textColor, 
                        stepSize: 1,
                        font: { family: "'Inter', sans-serif", size: 11 }
                    },
                    grid: { color: gridColor, drawBorder: false }
                },
                x: {
                    ticks: { 
                        color: textColor,
                        font: { family: "'Inter', sans-serif", size: 11 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function displayRecentIssues(issues) {
    const tbody = document.querySelector('#recentIssues tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    issues.forEach(issue => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${issue.book?.title || 'N/A'}</td>
            <td><span class="status-badge status-${issue.status}">${issue.status}</span></td>
        `;
    });
}

function displayOverdueBooks(overdue) {
    const tbody = document.querySelector('#overdueBooks tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    overdue.forEach(issue => {
        const today = new Date();
        const dueDate = new Date(issue.dueDate);
        const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        const fine = daysLate * 10;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${issue.book?.title || 'N/A'}</td>
            <td>${issue.user?.name || 'N/A'}</td>
            <td>${new Date(issue.dueDate).toLocaleDateString()}</td>
            <td>₹${fine}</td>
        `;
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadDashboard();
});