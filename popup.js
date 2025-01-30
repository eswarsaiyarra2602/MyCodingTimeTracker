document.addEventListener("DOMContentLoaded", () => {
    const platforms = {
        "leetcode.com": "leetcode-time",
        "geeksforgeeks.org": "geeksforgeeks-time",
        "codechef.com": "codechef-time",
        "codeforces.com": "codeforces-time"
    };

    // Retrieve storage data
    chrome.storage.local.get(['codingData'], (data) => {
        const codingData = data.codingData || {};
        const timeSpentOnWebsites = codingData.timeSpentOnWebsites || {};
        const streak = codingData.streak || 0; 

        // Loop through the platforms and update the UI
        Object.entries(platforms).forEach(([domain, elementId]) => {
            let timeSpent = timeSpentOnWebsites[domain] || 0; // Get time spent for the domain
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = formatTime(timeSpent); 
            }
        });

        //total time spent today
        let totalTimeToday = Object.values(timeSpentOnWebsites).reduce((sum, time) => sum + time, 0);
        const totalTimeElement = document.getElementById('total-time');
        if (totalTimeElement) {
            totalTimeElement.textContent = `Total Time Today: ${formatTime(totalTimeToday)}`;
        }

        //streak
        const streakElement = document.getElementById('streak-days-count');
        if (streakElement) {
            streakElement.textContent = streak > 0 ? streak : 0;  
        }
    });
});

// Format seconds to HH:MM:SS
function formatTime(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}