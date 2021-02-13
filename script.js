var countup;
var _clock;
var storeTime;
var elementStart = document.getElementById('start')
var startTime = 65; // in second

// load db with 'alert' key
getDB('alert', (data) => {
    var txt = document.getElementById("enter");
    // if the data exist, then insert it the input value
    if (data.alert) {
        txt.value = data.alert; //? txxt.value doesn't show when you do console.log(txt.value). Does it not work?
    }
})


// get time from db
getDB('time', (data) => {
    storeTime = data.time;
    if (storeTime > 0) { //could've been written cleaner. If start hit, switch to Extend.
        elementStart.innerHTML = 'Extend'; // show extend button if time > 0
        _clock = $('.clock').FlipClock(storeTime, {
            clockFace: 'DailyCounter',
            showSeconds: false,
            countdown: false
        });
    } else {
        _clock = $('.clock').FlipClock(0, { //do nothing
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
        }, 2000);
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
        elementStart.innerHTML = 'Start'

        chrome.runtime.sendMessage({ cmd: "stop" });
        setDB('time', 0)
        setDB('Extended', false)
        clearInterval(countup);
        _clock.stop();
        _clock = $('.clock').FlipClock(0, {
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
