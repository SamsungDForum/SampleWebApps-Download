App = window.App || {};
App.Main = (function Main() {
    var logger = App.Logger.create({
        loggerEl: document.querySelector('.logsContainer'),
        loggerName: 'Main',
        logLevel: App.Logger.logLevels.ALL
    });
    var src = 'http://www.ovh.net/files/10Gb.dat'; // source link to test on
    var srcFileName = '10Gb.dat';
    var downloadStatus = {
        START: 'start',
        PAUSE: 'pause',
        RESUME: 'resume'
    };
    var downloadButtonStatus;
    var downloadId = 0;
    var downloadStartTime; // helps counting whole time of downloading to evaluate speed and elapsed time
    var intervalStartTime;
    var roundNumber = App.Utils.roundNumber;
    var appElements = {
        testWindow: document.querySelector('.test-window'),
        status: document.querySelector('#info-container h2'),
        currentSpeed: document.querySelector('.current-speed span'),
        avgSpeed: document.querySelector('.avg-speed span'),
        maxSpeed: document.querySelector('.max-speed span'),
        elapsedTime: document.querySelector('.elapsed-time span'),
        progress: document.querySelector('.progress-bar div'),
        downloadButton: document.querySelector('.download-button'),
        progressBar: document.querySelector('.progress-bar')
    };

    // sets app background depending on current speed connection
    function setBackground(speed) {
        var colorSpeed = Math.round(speed / 1000) > 255 ? 255 : Math.round(speed / 1000);
        var color = 'rgb(' + (255 - colorSpeed) + ',' + (colorSpeed / 2) + ',0)';
        appElements.testWindow.style.backgroundColor = color;
    }

    function updateStatus(status) {
        appElements.status.textContent = status;
    }

    function fixSpeed(speed) {
        var speedInBytes;

        if (speed === -1) {
            return '--';
        }
        speedInBytes = speed / 8;

        return speedInBytes > 1000 ? roundNumber(speedInBytes / 1000) + ' MB/s' : roundNumber(speedInBytes) + ' kB/s';
    }

    function updateSpeed(speed) {
        appElements.currentSpeed.textContent = fixSpeed(speed);
    }

    function updateAvgSpeed(speed) {
        appElements.avgSpeed.textContent = fixSpeed(speed);
    }

    function updateMaxSpeed(speed) {
        appElements.maxSpeed.textContent = fixSpeed(speed);
    }

    function updateElapsedTime(time) {
        appElements.elapsedTime.textContent = roundNumber(time / 1000) > 0 ? roundNumber(time / 1000) + 's' : '--';
    }

    function updateProgressBar(downloadRatio) {
        appElements.progress.style.width = downloadRatio * 100 + '%';
    }

    // manages deleting downloaded files to avoid junking the device
    function initializeDirectories() {
        var fullPath;

        function createDirectory() {
            tizen.filesystem.resolve('downloads', function (dir) {
                dir.createDirectory('speedtest');
                logger.log('Speedtest directory created');
                switchDownloadButton(downloadStatus.START);
            }, function () {
                logger.log('Speedtest directory already exists');
            });
        }

        function deleteDirectory(dir) {
            if (dir.isDirectory) {
                fullPath = dir.fullPath;
                tizen.filesystem.resolve('downloads', function (generalDir) {
                    generalDir.deleteDirectory(fullPath, true, createDirectory);
                });
                logger.log('Deleting speedtest directory');
            }
        }

        tizen.filesystem.resolve('downloads/speedtest', deleteDirectory, function () {
            logger.log('Speedtest directory not found');
            createDirectory();
        });
    }

    // switches download button into pause, resume, etc
    function switchDownloadButton(status) {
        downloadButtonStatus = status;
        appElements.downloadButton.textContent = status;
    }

    // calculates average speed based on recorded current speed values
    function getAvgSpeed(downloadingBytes, downloadingTime) {
        return downloadingBytes / downloadingTime;
    }

    function checkDownloadState() {
        if (downloadId) {
            return tizen.download.getState(downloadId);
        }

        return 'NOT STARTED';
    }

    // manages whole speed test
    function runSpeedTest() {
        var maxSpeed = 0;
        var downloadRequest;
        var connectionSpeed;
        var avgConnectionSpeed;
        var intervalDataSize = 0; // saves data downloaded since last record
        var intervalFinishTime; // helps calculating time intervals between records
        var prevReceivedSize = 0;
        var downloadingTime = 0;
        var listener;
        var isAbleToRunTest = true;
        var paused = false; // help managing behaviour of cancel button, shows is download paused

        downloadId = 0;
        downloadRequest = new tizen.DownloadRequest(src, 'downloads/speedtest');
        appElements.progressBar.classList.add('appeared');
        updateAvgSpeed(-1);
        updateMaxSpeed(-1);
        updateElapsedTime(-1);

        // listener manages download status
        listener = {
            onprogress: function (id, receivedSize, totalSize) {
                intervalFinishTime = new Date().getTime();
                if (intervalStartTime !== -1) {
                    intervalDataSize = receivedSize - prevReceivedSize;
                    connectionSpeed = intervalDataSize / (intervalFinishTime - intervalStartTime);
                    setBackground(connectionSpeed);
                }
                prevReceivedSize = receivedSize;
                intervalStartTime = intervalFinishTime;

                if (maxSpeed < connectionSpeed) {
                    maxSpeed = connectionSpeed;
                }

                updateSpeed(connectionSpeed);
                updateStatus('Testing... (' + Math.round(receivedSize / totalSize * 100) + '%)');
                updateProgressBar(receivedSize / totalSize);
                paused = false;
            },

            onpaused: function () {
                paused = true;
                updateStatus('Test paused');
                avgConnectionSpeed = getAvgSpeed(prevReceivedSize, downloadingTime);
                updateSpeed(-1);
                updateAvgSpeed(avgConnectionSpeed);
                updateMaxSpeed(maxSpeed);
                downloadingTime += (intervalFinishTime - downloadStartTime); // updates elapsed time by time till pause
                updateElapsedTime(downloadingTime);
                intervalFinishTime = new Date().getTime() - intervalStartTime;
            },

            oncanceled: function () {
                updateStatus('Test canceled');
                // sets averageSpeed based on records recorded till this moment
                avgConnectionSpeed = getAvgSpeed(prevReceivedSize, downloadingTime);
                updateSpeed(-1);
                updateMaxSpeed(maxSpeed);

                // makes elapsed time not being updated after cancelling paused test
                if (!paused) {
                    updateAvgSpeed(avgConnectionSpeed);
                    downloadingTime += (intervalFinishTime - downloadStartTime);
                    updateElapsedTime(downloadingTime);
                }
            },

            oncompleted: function () {
                // updates all measurements
                avgConnectionSpeed = getAvgSpeed(prevReceivedSize, downloadingTime);
                updateSpeed(-1);
                updateAvgSpeed(avgConnectionSpeed);
                updateStatus('Test finished');
                downloadButtonStatus = downloadStatus.START;
                switchDownloadButton(downloadStatus.START);
                appElements.downloadButton.textContent = 'Retake';
                updateMaxSpeed(maxSpeed);
                downloadingTime += (intervalFinishTime - downloadStartTime);
                updateElapsedTime(downloadingTime);
                initializeDirectories();
            },

            onfailed: function (id, error) {
                updateStatus('Test failed, error: ' + error.message);
                switchDownloadButton(downloadStatus.START);
                initializeDirectories();
            }
        };

        logger.log('Testing ' + srcFileName);

        if (isAbleToRunTest) {
            try {
                downloadStartTime = new Date().getTime();
                intervalStartTime = downloadStartTime;
                downloadId = tizen.download.start(downloadRequest, listener);
            } catch (err) {
                logger.error(err.name + ' appeared');
            }
        }

        switchDownloadButton(downloadStatus.PAUSE);
    }

    function pauseSpeedTest() {
        logger.log('Pausing test...');
        tizen.download.pause(downloadId);
        switchDownloadButton(downloadStatus.RESUME);
    }

    function resumeSpeedTest() {
        logger.log('Resuming test...');
        // updates downloadStartTime for elapsedTime not to count the time while being paused
        downloadStartTime = new Date().getTime();
        intervalStartTime = -1;
        tizen.download.resume(downloadId);
        switchDownloadButton(downloadStatus.PAUSE);
    }

    function buttonCancelHandler() {
        if (checkDownloadState() !== 'NOT STARTED') {
            tizen.download.cancel(downloadId);
        }

        // refreshes directory on every cancel
        initializeDirectories();
        appElements.downloadButton.textContent = downloadStatus.START;
        downloadButtonStatus = downloadStatus.START;
    }

    // manages download button behaviour based on current status
    function buttonDownloadHandler() {
        if (downloadButtonStatus === downloadStatus.START) {
            runSpeedTest();
        } else if (downloadButtonStatus === downloadStatus.PAUSE && checkDownloadState() === 'DOWNLOADING') {
            pauseSpeedTest();
        } else if (downloadButtonStatus === downloadStatus.RESUME && checkDownloadState() === 'PAUSED') {
            resumeSpeedTest();
        }
    }

    function addButtonsHandlers() {
        var buttonsWithHandlers = [
            { elementSelector: '.download-button', handler: buttonDownloadHandler },
            { elementSelector: '.cancel-button', handler: buttonCancelHandler }
        ];

        App.KeyHandler.addHandlersForButtons(buttonsWithHandlers);
    }

    window.onload = function () {
        initializeDirectories();
        addButtonsHandlers();
    };
}());
