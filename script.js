//even though script & branckround.js are both background scripts. They communicate via chrome.runtime.onMessage('cmd')

var countup;
var _clock;
var storeTime;
var elementStart = document.getElementById('start')
var startTime = 0;
getDB('startTime', function(db) {
    startTime = db.startTime
})

var token = 'asfdjklasjfdlk'
getDB('time', (db) => {
    if(db.time == 0) {

    console.log('current got hit from script.js')
    chrome.identity.getProfileUserInfo(function(userInfo) {
        console.log(JSON.stringify(userInfo))
        const userEmail = userInfo.email
        fetch('http://127.0.0.1/work/tst/response.php', {
                method: "POST",
                body: JSON.stringify({
                    email: userEmail,
                    token: token
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then((response) => response.json()) // this can prolly be taken out
            .then(function(json) {
                setDB('startTimer', json.time)
                startTime = json.time;
                console.log('timer is', json.time)
                _clock = $('.clock').FlipClock(startTime, { //do nothing
                    clockFace: 'DailyCounter',
                    showSeconds: false,
                    countdown: false,
                    autoStart: false
                });
                return json //can use 10 as an example
            })
            .then((json) => document.getElementById("enter").value = json.event) //can repalce answer w string for debugging
            .catch(console.log('didnt receive data')) // add err in function
    })
    }

})


//TODO if timer is being used and 55 miunutes has passed make post call to get the new access token
/*
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
sleep(55 minutes)
*/

function getCookies(domain, name, callback) {
    chrome.cookies.get({ "url": domain, "name": name }, function(cookie) {
        if (callback) {
            callback(cookie.value);
        }
    });
}

//usage:
getCookies("http://localhost:5000/", "user_token", function(id) {
    alert(id);
    let cookie = id
    // current(id) #pass to function
    //either save token in db to retrieve from background.js or send it as arg in same script w a POST call 
});



document.getElementById("popup").addEventListener("click", function() {
    chrome.tabs.create({ url: "https://www.dayliii.com/Feedback" });
});
// load db with 'alert' key //TODO: change alert name to more meaningful
getDB('alert', (data) => {
    var txt = document.getElementById("enter");
    // if the data exist, then insert it the input value
    if (data.alert) {
        txt.value = data.alert;
    }
})


// get time from db
getDB('time', (data) => {
    storeTime = data.time;
    // startTime = data.time;

    // startTime = getDB('EventTime')
    // console.log('Event time is ' + startTime)
    if (storeTime > 0) { //could've been written cleaner. If start hit, switch to Extend.
        elementStart.innerHTML = 'Extend'; // show extend button if time > 0
        //* add current event name
        _clock = $('.clock').FlipClock(storeTime, {
            clockFace: 'DailyCounter',
            showSeconds: false,
            countdown: false
        });
    } else {

        _clock = $('.clock').FlipClock(startTime, { //do nothing
            clockFace: 'DailyCounter',
            showSeconds: false,
            countdown: false,
            autoStart: false
        });
    }

    // get extended from db
    getDB('extended', function(opt) {
        // if stored time has reach starttime
        // and if extended is false then stop the timer on the popup
        if (data.time == startTime && opt.extended == false) {
            _clock.stop()
        }
    })
})


elementStart.addEventListener('click', function(e) {

    let buttonname = e.target.innerHTML;
    if (buttonname == 'Start') {
        e.target.innerHTML = 'Extend'

        // send start to background.js
        chrome.runtime.sendMessage({ cmd: "start" });
        currentEvent();


        _clock = $('.clock').FlipClock(startTime, {
            clockFace: 'DailyCounter',
            showSeconds: false,
            countdown: false,
            autoStart: false
        });
        _clock.setTime(startTime);


        setTimeout(() => {
            _clock.setTime(0);
            _clock.start();
            countup = setInterval(function() {

                var timeup = _clock.getTime().time;
                if (timeup == startTime) {
                    // play sound, and show popup

                    _clock.stop();
                    clearInterval(countup)
                } else {
                    setDB('time', _clock.getTime().time)
                }

            }, 1000);
        }, 500);
    } else {
        chrome.runtime.sendMessage({ cmd: "extend" });
        setDB('Extended', true)

        countup = setInterval(function() {
            _clock.start()
            setDB('time', _clock.getTime().time)

        }, 1000);
    }
});

var elementStop = document.getElementById("stop");
elementStop.addEventListener('click', function() {

    var txt = document.getElementById("enter").value;
    if (txt.length > 0) { //could have been if null
        chrome.runtime.sendMessage({ cmd: 'alert' })
        document.getElementById("enter").value = ''
        elementStart.innerHTML = 'Start'
        chrome.runtime.sendMessage({ cmd: "stop" });
        setDB('time', 0)
        setDB('Extended', false)
        clearInterval(countup);
        _clock.stop();
        _clock = $('.clock').FlipClock(startTime, {
            clockFace: 'DailyCounter',
            showSeconds: false,
            countdown: false,
            autoStart: false
        });
    }

});

document.getElementById("enter").addEventListener('keyup', function(e) {
    setDB('alert', e.target.value)
});


function extend(timespan) {
    //should extend the timer from the timespan that it stopped
    _clock = $('.clock').FlipClock(timespan, {
        clockFace: 'DailyCounter',
        showSeconds: false,
        countdown: false,
    });
}


function setDB(key, value) {
    chrome.storage.sync.set({
        [key]: value
    });

}

function getDB(key, cb) {
    chrome.storage.sync.get(key, (opt) => {
        cb(opt)
    });
}

//my code
function currentEvent() {
    chrome.storage.local.get(['time'], function(result) {
        if (result.currentEvent) {
            document.getElementById("enter").value = result.currentEvent;
            console.log("the current event is " + result.currentEvent)
        } else {
            console.log('no current event')
        }
    });
}
chrome.storage.local.get(['list'], function(result) {
    if (result) {
        for (i of result.list) {
            var option = document.createElement("option");
            option.text = i;
            option.value = "myvalue";
            // var select = document.getElementById("cars");
            // var select = document.querySelector("cars");
            var select = document.querySelector("#cars");
            select.appendChild(option);
            console.log(i + ' got appended')
        }
    } else(console.log('no events'));
});