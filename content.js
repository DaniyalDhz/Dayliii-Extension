var globalInterval;

// chrome.identity.getProfileUserInfo(function(userInfo) {
//   console.log(JSON.stringify(userInfo));
//   let userEmail = userInfo.email;
//   let userId = userInfo.id;
// });

// globalInterval = setInterval(() => {
//     var currenttime = localStorage.getItem('time');
//     var settime = localStorage.getItem('settime');
//     if (currenttime > settime) {

//     }

// }, 500);



chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if (request.cmd == "closepopup") {
            popup = document.querySelector('#extensionpopup')
            if (popup) popup.remove(); //removes popup
        }

        if (request.cmd == "popup") {
            popup = document.querySelector('#extensionpopup')
            if (popup) popup.remove(); //removes popup but from a different cmd
            console.log('play sound') //can be taken out
            document.body.innerHTML += `    <style>
        #extensionpopupcontainer {
        height:100vh !important;
        width:100vw !important;
        position:fixed !important;
        z-index:999999999999 !important;
        top:0 !important;
        left: 0 !important;
        background: transparent !important;
        }
        #extensionpopup input {
            box-sizing: initial !important;
        }
        #extensionpopup {
            position: fixed !important;
            padding: 1em 1em !important;
            width: 276px !important;
            box-sizing: initial !important;
            right: 5vw !important;

            top: 5vh !important;
            z-index: 999999999999999999999 !important;
            box-shadow: 2px 2px black !important;
        }

        #extensionpopup #clock1 {
            display: block !important;
        }
    </style>
    <div id="extensionpopupcontainer" >
    <div id="extensionpopup" style="background-color: rgb(187, 186, 186)">
        <div class="clock" id="clock1" style="position: static;margin-top: 10px; margin-left: 0; margin-bottom: 50px;"></div>
        <div id="copyright" style="height: 100px;">
            <div style="float: left;width: 50%;height:70px">
                <div style="float: left;height: 25px;">
                    <div class="dropdown" style> <label for="cars"></label> <select name="cars" id="cars" style="width: 130px;height: 20px;"></select> <br /><br /> </div>
                </div>
                <div style="float:left">
                    <button class="start" id="start" style=" line-height: 32px; width: 130px; margin-top:10px">Start</button>
                </div>
            <div style="clear: left;"></div>

            </div>

            <div style="float: right;width: 50%;height:70px">
                <div style="float: right"> <input type="text" id="enter" style="width: 123px;margin-right: 3px;height: 15px;"> </div>
                <div style="float: right;">
                    <button class="submit" id="stop" style=" line-height: 32px; width: 130px;    margin-top: 10px;margin-right: 3px; ">Done</button>
            <div style="clear: right;"></div>

                </div>
            </div>
            <div style="clear: both;"></div>
        </div>
    </div>
    </div>
    `
    // document.getElementById("stop").addEventListener('click', function(){console.log(document.getElementById('enter').value)})
            document.querySelector('#extensionpopupcontainer').addEventListener('click', (e) => {
                if (e.target.attributes.id.value == 'extensionpopupcontainer') {
                    document.querySelector('#extensionpopupcontainer').remove() //? what does this do?
                }
                if (e.target.attributes.id.value == 'start') {
                    document.querySelector('#extensionpopupcontainer').remove()
                }
                if (e.target.attributes.id.value == 'stop') {
                    document.querySelector('#extensionpopupcontainer').remove()
                }
            })
            var countup;
            var _clock;
            var storeTime;
            var elementStart = document.getElementById('start')
            var startTime = 5;

            // load db with 'alert' key
            getDB('alert', (data) => {
                var txt = document.getElementById("enter");
                // if the data exist, then insert it the input value
                if (data.alert) {
                    txt.value = data.alert;
                    console.log('the data is ' + txt.value)
                }
            })


            // get time from db
            getDB('time', (data) => {
                storeTime = data.time;
                if (storeTime > 0) {
                    elementStart.innerHTML = 'Extend'; // show extend button if time > 0
                    _clock = $('.clock').FlipClock(storeTime, {
                        clockFace: 'DailyCounter',
                        showSeconds: false,
                        countdown: false
                    });
                } else {
                    _clock = $('.clock').FlipClock(0, {
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
                    e.target.innerHTML = 'Extend' //can't this be: buttonname = 'Extend'. Answer: unfortunately, that just renew the variable value and not affecting the html

                    // send start to background.js
                    chrome.runtime.sendMessage({ cmd: "start" });

                    _clock = $('.clock').FlipClock(startTime, {
                        clockFace: 'DailyCounter',
                        showSeconds: false,
                        countdown: false,
                        autoStart: false
                    });

                    setTimeout(() => {
                        _clock.setTime(0);
                        _clock.start();
                        countup = setInterval(function() {

                            var timeup = _clock.getTime().time;
                            if (timeup > startTime) {
                                _clock.stop();
                                clearInterval(countup)
                            } else {
                                setDB('time', _clock.getTime().time)
                            }

                        }, 1000);
                    }, 10);
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
                if (txt.length > 0) {
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

                    getDB('alert', (database) => {
                        console.log(database.alert)
                    })
                }

            });

            document.getElementById("enter").addEventListener('keyup', function(e) { //an event when ou type in the input
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

        }
    }
);

// chrome.storage.local.get(['list'], function(result) {
//     if (result) {
//         for (i of result.list) {
//             var option = document.createElement("option");
//             option.text = i;
//             option.value = "myvalue";
//             // var select = document.getElementById("cars");
//             // var select = document.querySelector("cars");
//             var select = document.querySelector("#cars");
//             select.appendChild(option);
//             console.log(i + ' got appended')
//         }
//     } else(console.log('no events'));
// });

// chrome.storage.local.get(['dailyEvents'], function(result) {
//     if (result){
//         for (i of result.dailyEvents)
//             {
//             // var option = document.createElement("button");
//             // option.text = i;
//             // option.value = "myvalue";
//             // var select = document.querySelector("#cars");
//             // select.appendChild(option);
//             // console.log(i + ' got appended')
//             var btn = document.createElement("BUTTON");
//             btn.innerHTML = "CLICK ME";
//             document.body.appendChild(btn);
//             }
//         }
//     else(console.log('no events'));
// });





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