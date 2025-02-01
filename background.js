let activeTab = null;
let startTime = null;
const codingSites = ["leetcode.com", "geeksforgeeks.org", "codechef.com", "codeforces.com"];
const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).toISOString().split('T')[0];

// Initialize Storage if not present
function initStorage() {
    chrome.storage.local.get('codingData', function(result) {
        if (!result.codingData) {
            setInitialData();
        } else {
            // Reset timeSpentOnWebsites if it's a new day
            const lastVisit = result.codingData.lastVisitDate || '';
            if (lastVisit !== today) {
                resetDailyTracking(result.codingData);
            }
        }
    });
}

// Set initial data structure
function setInitialData() {
    const initialData = {
        streak: 0,
        lastVisitDate: '',
        dailyGoal: 120,
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

// Reset daily tracking when a new day starts
function resetDailyTracking(data) {
    data.timeSpentOnWebsites = {
        "leetcode.com": 0,
        "geeksforgeeks.org": 0,
        "codechef.com": 0,
        "codeforces.com": 0,
    };
    data.timeSpentOnDay[today] = 0;
    data.lastVisitDate = today;

    chrome.storage.local.set({ 'codingData': data }, function() {
        console.log('Daily tracking reset for a new day.');
    });
}

// Save time spent before a tab reloads or switches
function saveAndResetTime() {
    if (activeTab && startTime) {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        if (elapsedTime > 0) {
            console.log(`Saving time for ${activeTab}: ${elapsedTime} seconds`);
            saveTime(activeTab, elapsedTime);
        }
    }
    startTime = Date.now(); // Reset start time
}

// Event listener for tab updates (includes reload)
let lastTabId = null;
let lastUrl = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        if (tab.url !== lastUrl || tabId !== lastTabId) {
            console.log(`Page loaded: ${tab.url}`);
            lastTabId = tabId;
            lastUrl = tab.url;
        }
    }
});

// Event listener for switching tabs
chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab && tab.url) {
            console.log(`Tab activated: ${tab.url}`);
            handleTabChange(tab.url);
        }
    });
});

// Event listener for tab closure
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    saveAndResetTime();
    activeTab = null;
});

// Handle tab changes (switching tabs or closing them)
function handleTabChange(url) {
    const domain = getDomain(url);

    if (activeTab === domain) {
        console.log("Already tracking this site, ignoring duplicate switch.");
        return; // Prevent double counting if user stays on the same site
    }

    // Save time for previous site
    saveAndResetTime();

    // Start tracking new site if it's a coding site
    if (codingSites.includes(domain)) {
        console.log(`Switched to coding site: ${domain}`);
        activeTab = domain;
        startTime = Date.now();
        updateStreakAndResetDailyTracking();
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
        currentData.timeSpentOnDay[today] = (currentData.timeSpentOnDay[today] || 0) + seconds;

        // Save updated data to Chrome Storage
        chrome.storage.local.set({ 'codingData': currentData }, function() {
            console.log(`Updated Time for ${site}: ${newTime} seconds`);
            console.log(`Total time spent today: ${currentData.timeSpentOnDay[today]} seconds`);
        });
    });
}

// Update streak and reset daily tracking if necessary
function updateStreakAndResetDailyTracking() {
    chrome.storage.local.get('codingData', function(result) {
        let currentData = result.codingData || {};
        const lastVisit = currentData.lastVisitDate;

        if (lastVisit !== today) {
            currentData.streak = isConsecutiveDate(lastVisit, today) ? currentData.streak + 1 : 1;
            currentData.lastVisitDate = today;

            // Reset time spent tracking for a new day
            resetDailyTracking(currentData);
        }

        chrome.storage.local.set({ 'codingData': currentData }, function() {
            console.log(`Updated streak: ${currentData.streak}`);
        });
    });
}

// Check if two dates are consecutive
function isConsecutiveDate(lastVisit, today) {
    if (!lastVisit) return false;
    const lastDate = new Date(lastVisit);
    const todayDate = new Date(today);
    return (todayDate - lastDate) / (1000 * 60 * 60 * 24) === 1;
}

// Extract domain from URL
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