var startTime

// load db with 'alert' key
getDB(['startTime'], (data) => {
    if (data.startTime) {
        startTime = data.startTime;
    } else {
        startTime = 5;
        setDB('startTime', startTime)
    }
})

console.log(startTime)
//TODO: Integrate with website
//TODO Add authentication for security

// restart chrome when first installed
chrome.runtime.onInstalled.addListener(function(inv) {
        if ('install' == inv.reason) {
            chrome.tabs.create({url:"data:text/html, <h1>Installed successfully, please restart your browser</h1>'"})

            chrome.tabs.getAllInWindow(null, function(tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    chrome.tabs.reload(tabs[i].id);
                }
            });
        }
})

let tabId;
chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    console.log(tabs[0].id) //? does 0 represent current tab? what's point of this?
})
// fetch('http://127.0.0.1:5000/current', {
//     method: 'POST',
//     body: JSON.stringify({
//         email: '@gmail.com', //sample data
//         id: '2' //sample data
//     }),
//     headers: {
//         'Content-Type': 'application/json;charset=UTF-8',
//         Accept: 'application/json'
//     }
// })


//alert means when stop is clieked


//stores value upon change
chrome.storage.onChanged.addListener(function(changes, storageName) {
    let timestamp = changes.time.newValue; //chrome.storage.onChanged is an event that happens when db is changed. //changes = they new db. time = they key of db. newValue = new value of time in db.
    var sec_num = parseInt(timestamp, 10); // don't forget the second param //parseInt is same as int()
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; } //for display purposes
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    let formattedTime = hours + ':' + minutes;
    chrome.browserAction.setBadgeText({ "text": formattedTime })
}) //function solely for the badge (icon timer) display and functionality

let countup2; //for start
let countup3; //for extend
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.cmd == "start") { //comes from chrome.tabs.sendmessage(tabid{cmd:'start'}). sends message sends an object.
            countup2 = setInterval(() => {
                getDB('time', function(opt) { //opt is a data callback from the database when you use getDB(key, callback)
                    var timeup = opt.time
                    console.log(timeup, startTime)

                    if (timeup == startTime) {
                        clearInterval(countup2)
                        playsound()
                        chrome.tabs.sendMessage(tabId, { cmd: "popup" }) //? what is cmd?
                        console.log('popup to tab ', tabId)
                        return false;
                    } else {
                        setDB('time', opt.time + 1) //? why adding + 1?
                    }

                })
            }, 1000); //every 1000ms, it will check if timeup == startTime or not
            // current();
        }

        if (request.cmd == "extend") {
            countup3 = setInterval(() => {
                getDB('time', function(opt) {
                    setDB('time', opt.time + 1)
                })
            }, 1000);
            console.log(request.cmd)
        }


        if (request.cmd == "stop") {
            clearInterval(countup2) //resets time
            clearInterval(countup3) //resets extension time
            setDB('time', 0)
            setDB('extended', false)
        }

        if (request.cmd == "alert") {
            getDB('alert', function(database) {
                console.log('alert value is ', database.alert)
                let eventName = database.alert
                // submit(eventName)
            })
        }

    }
);

function setDB(key, value) {
    chrome.storage.sync.set({
        [key]: value
    });

}

function getDB(key, cb) { //cb is callback
    chrome.storage.sync.get(key, (opt) => {
        cb(opt)
    });

}

function playsound() {
    console.log('play sound')
    var audio = new Audio('https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-61905/zapsplat_bells_small_hand_bell_ring_in_water_weird_cartoon_tone_001_61906.mp3');
    audio.play();
}

chrome.tabs.onActiveChanged.addListener((newid) => {
    console.log('change tab to ', newid)
    tabId = newid;

    chrome.tabs.sendMessage(newid, { greeting: "hello" }, function(response) {
        if(response && response.farewell) {
            console.log(response.farewell);
        } else {
            console.log('ga dapet jawaban');

            chrome.tabs.reload(newid)
            chrome.tabs.sendMessage(newid, { greeting: "hello" }, function(response) {
            console.log(response?.farewell);
            })
        }
    })

})

//Server  API codes
function submit(eventName) {
    console.log('submitted')
    console.log('User inputted ' + eventName + ' from submit')

    chrome.identity.getProfileUserInfo(function(userInfo) {
        const userEmail = userInfo.email
        calName = document.getElementById('cars') // name of calendar (for goals)
        // let eventName = document.getElementById('enter').onclick; //eventName
        fetch('http://127.0.0.1:5000/execute', {
                method: 'POST',
                body: JSON.stringify({
                    email: userInfo.email,
                    // callName: 'Personal Finance',
                    eventName: eventName
                }),
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    Accept: 'application/json'
                }
            })
            .then((response) => response.json())
            .then(function(json) {
                if (json.message === 'daily limit of 5 reached. Subscribe for unlimited access') { //FIXME: sentence should not be hardcoded
                    alert('daily limit of 5 reached. Subscribe for unlimited access') //TODO: provide a link			
                } else {
                    chrome.storage.local.set({ executeResponse: json.message })
                }
            })
            .catch(console.log('didnt receive data ' + response)) // add err in function
    })
}

var views = chrome.extension.getViews({
    type: 'popup'
})
for (var i = 0; i < views.length; i++) {
    views[i].document
        .getElementById('submit')
        .addEventListener('click', submit)
    console.log('loaded')
}

function current() {
    // should be merged with start() func
    console.log('current got hit')
    chrome.identity.getProfileUserInfo(function(userInfo) {
        console.log(JSON.stringify(userInfo))
        const userEmail = userInfo.email
        fetch('http://127.0.0.1:5000/current', {
                method: 'POST',
                body: JSON.stringify({
                    email: userEmail
                }),
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    Accept: 'application/json'
                }
            })
            .then((response) => response.json()) // this can prolly be taken out
            .then(function(json) {
                chrome.storage.local.set({
                    currentEvent: json.event
                })
                chrome.storage.local.set({
                    list: json.list
                })
                chrome.storage.local.set({
                    dailyEvents: json.dailyEvents
                })
                // document.getElementById('enter').onclick = json.event // name of event
            })
            .catch(console.log('didnt receive data')) // add err in function
    })
}

var views = chrome.extension.getViews({
    type: 'popup'
})
for (var i = 0; i < views.length; i++) {
    views[i].document.getElementById('start').addEventListener('click', current)
    console.log('loaded')
}








function getCurrentTab(callback) {
    chrome.tabs.query({
            currentWindow: true,
            active: true,
            windowType: 'normal',
        },
        function(tab) {
            callback(tab[0]);
        }
    );
}