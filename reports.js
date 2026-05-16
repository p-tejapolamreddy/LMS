// Generate report
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    try {
        const token = getToken();
        let url = `${API_URL}/issues/report`;
        
        // Always pass dates if available to ensure consistent filtering from backend
        const params = new URLSearchParams();
        if (fromDate) params.append('startDate', fromDate);
        if (toDate) params.append('endDate', toDate);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
        
        const response = await fetch(url, {
            headers: { 'x-auth-token': token }
        });
        
        let issues = await response.json();
        
        // Filter based on report type
        switch(reportType) {
            case 'issued':
                issues = issues.filter(i => i.status === 'issued');
                break;
            case 'overdue':
                issues = issues.filter(i => {
                    const dueDate = new Date(i.dueDate);
                    const today = new Date();
                    return i.status === 'issued' && dueDate < today;
                });
                break;
            case 'returned':
                issues = issues.filter(i => i.status === 'returned');
                break;
        }
        
        displayReport(issues);
    } catch (error) {
        console.error('Error generating report:', error);
        showMessage('Error generating report', 'error');
    }
}

// Display report in table
function displayReport(issues) {
    const tbody = document.querySelector('#reportTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!Array.isArray(issues) || issues.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="7" style="text-align: center;">No records found</td>';
        return;
    }
    
    issues.forEach(issue => {
        const row = tbody.insertRow();
        const today = new Date();
        const dueDate = new Date(issue.dueDate);
        const isOverdue = issue.status === 'issued' && dueDate < today;
        
        // Calculate fine
        let fine = issue.fine || 0;
        if (isOverdue) {
            const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysLate * 10;
        }

        row.innerHTML = `
            <td>${issue.book?.title || 'N/A'}</td>
            <td>${issue.user?.name || 'N/A'}</td>
            <td>${new Date(issue.issueDate).toLocaleDateString()}</td>
            <td>${new Date(issue.dueDate).toLocaleDateString()}</td>
            <td>${issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : 'Not returned'}</td>
            <td><span class="status-badge status-${isOverdue ? 'overdue' : issue.status}">${isOverdue ? 'overdue' : issue.status}</span></td>
            <td>₹${fine}</td>
        `;
    });
}

// Export to CSV
function exportToCSV() {
    const table = document.getElementById('reportTable');
    if (!table) return;

    const csv = [];
    
    // Get headers
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
        headers.push(th.textContent);
    });
    csv.push(headers.join(','));
    
    // Get data
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) { // Skip "No records found" row which has colspan=7
            const rowData = [];
            cells.forEach(cell => {
                let text = cell.textContent.trim().replace(/,/g, '');
                rowData.push(text);
            });
            csv.push(rowData.join(','));
        }
    });
    
    if (csv.length <= 1) {
        showMessage('No data to export', 'error');
        return;
    }

    // Download CSV
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Report form submission
if (document.getElementById('reportForm')) {
    document.getElementById('reportForm').addEventListener('submit', (e) => {
        e.preventDefault();
        generateReport();
    });
}

// Set default dates on page load
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const fromInput = document.getElementById('fromDate');
    const toInput = document.getElementById('toDate');
    
    if (fromInput) fromInput.value = firstDay.toISOString().split('T')[0];
    if (toInput) toInput.value = today.toISOString().split('T')[0];
    
    // Generate initial report
    generateReport();
});