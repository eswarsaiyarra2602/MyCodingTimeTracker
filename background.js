let activeTab = null;
let startTime = null;
const codingSites = ["leetcode.com", "geeksforgeeks.org", "codechef.com", "codeforces.com"];
const today = new Date().toISOString().split('T')[0]; // 'yyyy-mm-dd' format

// Initialize Storage if not present
function initStorage() {
    chrome.storage.local.get('codingData', function(result) {
        if (!result.codingData) {
            const initialData = {
                streak: 0,
                lastVisitDate: '',
                dailyGoal: 120, // Default daily goal in minutes
                timeSpentOnDay: {}, 
                timeSpentOnWebsites: { 
                    "leetcode.com": 0,
                    "geeksforgeeks.org": 0,
                    "codechef.com": 0,
                    "codeforces.com": 0,
                }
            };
            chrome.storage.local.set({ 'codingData': initialData }, function() {
                console.log('Initial data structure set.');
            });
        }
    });
}

// Event listener for tab activation (Switching tabs)
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab && tab.url) {
            handleTabChange(tab.url);
        }
    });
});

// Event listener for tab updates (Reloading pages, changing URLs)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        handleTabChange(tab.url);
    }
});

// Event listener for tab removal (Closing tabs)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (activeTab) {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedTime > 0) {
            saveTime(activeTab, elapsedTime);
        }
        activeTab = null;
        startTime = null;
    }
});

// Handle tab changes (Switching tabs or closing them)
function handleTabChange(url) {
    const domain = getDomain(url);

    // If switching from a coding site, save the time spent
    if (activeTab && codingSites.includes(activeTab)) {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedTime > 0) {
            saveTime(activeTab, elapsedTime);
        }
    }

    // If the new tab is a coding site, start tracking time
    if (codingSites.includes(domain)) {
        console.log(`Switched to ${domain}`);
        activeTab = domain;
        startTime = Date.now();
        updateStreak();
    } else {
        console.log(`Left coding site: ${activeTab}`);
        activeTab = null;
        startTime = null;
    }
}

// Save the time spent on a coding website
function saveTime(site, seconds) {
    chrome.storage.local.get('codingData', (result) => {
        let currentData = result.codingData || {};
        const prevTime = currentData.timeSpentOnWebsites[site] || 0;
        const newTime = prevTime + seconds;

        // Update time for the site
        currentData.timeSpentOnWebsites[site] = newTime;

        // Update total time for the day
        if (currentData.timeSpentOnDay[today]) {
            currentData.timeSpentOnDay[today] += seconds;
        } else {
            currentData.timeSpentOnDay[today] = seconds;
        }

        // Save updated data to Chrome Storage
        chrome.storage.local.set({ 'codingData': currentData }, function() {
            console.log(`Updated Time for ${site}: ${newTime} seconds`);
            console.log(`Total time spent today: ${currentData.timeSpentOnDay[today]} seconds`);
        });
    });
}

// Update streak tracking
function updateStreak() {
    chrome.storage.local.get('codingData', function(result) {
        const currentData = result.codingData || {};
        const lastVisit = currentData.lastVisitDate;
        
        // Check if today's date is consecutive
        if (lastVisit === today) {
            console.log('Already visited today!');
        } else {
            // If today's date is consecutive with last visit, increment streak
            if (isConsecutiveDate(lastVisit, today)) {
                currentData.streak += 1;
            } else {
                // Reset streak if not consecutive
                currentData.streak = 1;
            }

            currentData.lastVisitDate = today;

            // Save streak data
            chrome.storage.local.set({ 'codingData': currentData }, function() {
                console.log(`Updated streak: ${currentData.streak}`);
            });
        }
    });
}

// Check if two dates are consecutive
function isConsecutiveDate(lastVisit, today) {
    const lastDate = new Date(lastVisit);
    const todayDate = new Date(today);

    const diff = (todayDate - lastDate) / (1000 * 60 * 60 * 24);
    return diff === 1;
}

// Extract domain from URL (case insensitive)
function getDomain(url) {
    try {
        if (!url || url.startsWith("chrome://") || url.startsWith("about:blank") || url.startsWith("data:")) {
            console.log(`Invalid URL: ${url}`);
            return ""; 
        }

        const parsedUrl = new URL(url);
        return parsedUrl.hostname.replace("www.", "").toLowerCase();
    } catch (error) {
        console.error("Invalid URL:", url);  
        return "";  
    }
}

// Initialize storage on extension load
initStorage();