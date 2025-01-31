document.addEventListener("DOMContentLoaded", () => {
    const platforms = {
        "leetcode.com": "leetcode-time",
        "geeksforgeeks.org": "geeksforgeeks-time",
        "codechef.com": "codechef-time",
        "codeforces.com": "codeforces-time"
    };

    // Retrieve storage data
    chrome.storage.local.get(['codingData'], (data) => {
        console.log("Data retrieved from storage:", data);  // Log storage data

        const codingData = data.codingData || {};
        const timeSpentOnWebsites = codingData.timeSpentOnWebsites || {};
        const streak = codingData.streak || 0;
        const timeSpentOnDay = codingData.timeSpentOnDay || {};
        const dailyGoal = codingData.dailyGoal || 0;

        console.log("Calling updateGraph with:", timeSpentOnDay);
        updateGraph(timeSpentOnDay);    

        // Update individual platform times
        Object.entries(platforms).forEach(([domain, elementId]) => {
            let timeSpent = timeSpentOnWebsites[domain] || 0;
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = formatTime(timeSpent); 
            }
        });

        // Total time spent today
        let totalTimeToday = Object.values(timeSpentOnWebsites).reduce((sum, time) => sum + time, 0);
        const totalTimeElement = document.getElementById('total-time');
        if (totalTimeElement) {
            totalTimeElement.textContent = `Total Time Today: ${formatTime(totalTimeToday)}`;
        }

        // Streak update
        const streakElement = document.getElementById('streak-days-count');
        if (streakElement) {
            streakElement.textContent = streak > 0 ? streak : 0;  
        }

        // Goal achievement message
        const goalMessageElement = document.getElementById('goal-message');
        if (totalTimeToday >= dailyGoal * 60) {
            goalMessageElement.textContent = "Daily Target Achieved !!";
        } else {
            goalMessageElement.textContent = `Goal set to ${dailyGoal} minutes`;
        }
    });
});

// Function to format time
function formatTime(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}


function updateGraph(timeSpentOnDay) {
    console.log("Data passed to updateGraph:", timeSpentOnDay);
    
    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];
    
    const lastWeekDates = [];
    const lastWeekData = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split("T")[0]; 

        lastWeekDates.push(formattedDate);

        lastWeekData.push(timeSpentOnDay[formattedDate] !== undefined ? timeSpentOnDay[formattedDate] : 0);
    }

    const lastWeekDataInMinutes = lastWeekData.map(seconds => Math.floor(seconds / 60));

    // Create the chart
    const ctx = document.getElementById('graph').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: lastWeekDates,
            datasets: [{
                label: 'Time Spent (minutes)',
                data: lastWeekDataInMinutes,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    grid: {
                        color: '#ddd',
                        lineWidth: 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Time Spent (minutes)'
                    },
                    ticks: {
                        beginAtZero: true
                    },
                    grid: {
                        color: '#ddd',
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    backgroundColor: '#fff',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#4CAF50',
                    borderWidth: 1,
                    caretSize: 6
                }
            }
        }
    });
    console.log("Chart created successfully");
}

// Save goal functionality
document.addEventListener("DOMContentLoaded", () => {
    const goalInput = document.getElementById("daily-goal");
    const saveButton = document.getElementById("submit-goal");

    chrome.storage.local.get(["codingData"], (data) => {
        if (data.codingData && data.codingData.dailyGoal) {
            goalInput.value = data.codingData.dailyGoal; 
        }
    });

    // Save goal
    saveButton.addEventListener("click", () => {
        const goal = parseInt(goalInput.value, 10);
        if (!isNaN(goal) && goal > 0) {
            chrome.storage.local.get(["codingData"], (data) => {
                let codingData = data.codingData || {};
                codingData.dailyGoal = goal;

                chrome.storage.local.set({ codingData }, () => {
                    console.log("Daily goal updated:", goal);
                    document.getElementById("goal-message").textContent = `Goal set to ${goal} minutes`;

                    // Re-check goal achievement
                    const totalTimeToday = Object.values(codingData.timeSpentOnWebsites || {}).reduce((sum, time) => sum + time, 0);
                    const goalMessageElement = document.getElementById('goal-message');
                    if (totalTimeToday >= goal * 60) {
                        goalMessageElement.textContent = "Daily Target Achieved !!";
                    } else {
                        goalMessageElement.textContent = `Goal set to ${goal} minutes`;
                    }
                });
            });
        } else {
            document.getElementById("goal-message").textContent = "Please enter a valid number!";
        }
    });
});