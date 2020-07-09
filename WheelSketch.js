function WheelSketch(_p5) {
    const radius = 160,
        diameter = radius * 2,
        itemsPerScreen = 7,
        height_str = diameter / itemsPerScreen,
        counterInitial = 0,
        centerX = 60
    ;
    let data = [],
        videosList = [
            'videos/14278244937910.webm',
            'videos/14686000376951.webm',
        ],
        counter,
        counterDelta = 0,
        counterMax,
        circleTop,
        circleCenterY,
        animationsMap = new Map(),
        selectedKey,
        isCounterAnimation = false,
        counterPrevTickValue = 0,
        video,
        scaleFactor,
        fontRegular,
        mouseDragEnable = true,
        touchYPrev = 0
    ;

    _p5.setData = function (_data) {
        data = [..._data];

        counterMax = data.length * height_str;
        counter = counterInitial;
        _p5.triggerSelectItem();
    };

    _p5.setVideos = function (videosList) {
        video = new Video(videosList);
    };

    _p5.onAfterSetup = function() {};

    _p5.onSelectItem = function (items, selectedKey) {};
    _p5.triggerSelectItem = function () {
        _p5.onSelectItem(data, selectedKey);
    };

    _p5.preload = () => {
        fontRegular = _p5.loadFont('./Oswald-Regular.ttf');
    };

    _p5.setup = () => {
        counterMax = data.length * height_str;

        const canvas = _p5.createCanvas(750, 400);
        canvas.parent('canvas');

        _p5.textSize(23);
        _p5.textFont(fontRegular);
        _p5.textLeading(24);
        _p5.fill(200);

        circleTop = (_p5.height - diameter) / 2 + _p5.textAscent() / 3;
        circleCenterY = circleTop + radius;
        counter = counterInitial;

        video = new Video(videosList);

        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState === 'visible') {
                video.setVolume(video.volume);
            } else {
                video.setVolume(0);
            }
        });
        // frameRate(30);

        const background = document.querySelector('.image-grid'),
            videoContainer = document.getElementById('video'),
            button = _p5.createButton('Крутить')
        ;

        button.parent(document.querySelector('.content'));
        button.mousePressed(function () {
            if (!isCounterAnimation) {
                const durationSec = video.getDuration() || 22,
                    totalRows = getTotalRowsForDurationAndSpeed(durationSec)
                ;

                video.play().catch(console.error);
                decreaseVolume(durationSec);

                array_shuffle(data);
                _p5.triggerSelectItem();

                videoContainer.style.animation = `play-video ${durationSec}s`;
                // videoContainer.classList = 'play';
                button.elt.style.visibility = 'hidden';

                // background.style.display = 'none';
                background.classList = 'image-grid animation-paused';

                animate(
                    tickCounter,
                    counter,
                    counter + height_str * totalRows,
                    durationSec * 1000,
                    () => {
                        // background.style.display = null;
                        button.elt.style.visibility = null;
                        videoContainer.style.animation = null;
                        // videoContainer.classList = '';
                        background.classList = 'image-grid';

                        animCounterStop();
                        video.pause();
                        alignToRow();
                    },
                    easeInOutSine
                );
            }

            return false;
        });

        _p5.onAfterSetup();
    };

    function decreaseVolume(videoDurationSec) {
        const decreasingDuration = 2000;
        setTimeout(function () {
            animate(function (v) {
                video.setVolume(v);
            }, video.volume, 0, decreasingDuration, null, easeLinear);
        }, videoDurationSec * 1000 - decreasingDuration);
    }

    function getTotalRowsForDurationAndSpeed(videoDurationSec = 22, speedItemsPerSec = 3) {
        return speedItemsPerSec * videoDurationSec;
    }

    _p5.mouseDragEnable = (state = true) => {
        mouseDragEnable = state;
    };

    _p5.mouseDragged = (event) => {
        if (_p5.mouseX > _p5.width || _p5.mouseY > _p5.height) {
            return;
        }
        if (isCounterAnimation) {
            return;
        }

        if (!mouseDragEnable) {
            return;
        }

        let delta = _p5.movedY * 4;
        // Для тач-девайсов эта переменная undefined, поэтому вручную считаем направление сдвига
        if (_p5.movedY === undefined) {
            let diff = _p5.touches[0].y - touchYPrev;
            delta = (diff < 0 ? -1 : (diff === 0 ? 0 : 1)) * 12;
            touchYPrev = _p5.touches[0].y;
        }

        incrementCounter(delta);

        return false;
    };

    _p5.draw = () => {
        _p5.clear();

        animationsMap.forEach(function (startAnimation) {
            startAnimation();
        });

        if (counterDelta > 0) {
            if (counter < counterMax) {
                if (!isCounterAnimation) {
                    incrementCounter(3);
                }
            }
            else {
                counter = counterInitial;
            }
        }
        else {
            if (counter < counterInitial) {
                counter = counterMax;
            }
        }

        for (let i = -data.length - 2; i < itemsPerScreen + 1; i++) {
            let {x, y} = vect(counter + height_str * i + radius, circleTop, circleTop + diameter, false);

            if (x < centerX - 45) {
                continue;
            }

            _p5.push();
            _p5.translate(centerX, circleCenterY);

            scaleFactor = _p5.map(x, centerX, centerX + radius, 1, 1.5, false);
            x = x * (2 - scaleFactor);
            y = y * (2 - scaleFactor);
            _p5.scale(scaleFactor);

            _p5.fill(255, Math.round(_p5.map(x + 50, centerX, centerX + radius, 0, 255, true)));

            let key = data_key(data.length, i);

            if (y < _p5.textAscent() / 2
                && y > -_p5.textAscent()
            ) {
                _p5.fill(255, 102, 0);
                _p5.noStroke();

                if (key !== selectedKey) {
                    selectedKey = key;

                    _p5.onSelectItem(data, selectedKey);
                }
            }

            _p5.text(data[key], x, y, 400);
            _p5.pop()
        }
    };

    function vect(current, from, to, overflow = true) {
        const offset = 7, // выравниваем центральный элемент списка вертикально по центру
            overallDegrees = _p5.map(current + offset, from + offset, to, -85, 85, !overflow),
            v = p5.Vector.fromAngle(_p5.radians(overallDegrees), radius)
        ;

        // _p5.push();
        // _p5.translate(centerX, _p5.height / 2);
        // _p5.noFill();
        // _p5.stroke(255);
        // _p5.line(0, 0, radius, 0);
        // _p5.stroke(250);
        // _p5.line(0, 0, v.x, v.y);
        // _p5.pop();

        return v;
    }

    function incrementCounter(delta = 1) {
        delta = (_p5.deltaTime / 100 * delta);
        counterDelta = delta;
        counter += delta;
    }

    function data_key(data_len, key) {
        if (!data_len) {
            return key;
        }

        if (key >= 0 && key < data_len) {
            return key;
        }

        if (key > 0) {
            return data_key(data_len, Math.abs(data_len - key));
        }

        return data_key(data_len, data_len + key);
    }

    function alignToRow(endCallback) {
        const half = height_str / 2;
        const rest = counter % height_str;
        let newValue = counter - rest;
        if (rest > half) {
            newValue = counter + height_str - rest;
        }
        animate(
            tickCounter,
            counter,
            newValue,
            1500,
            function () {
                animCounterStop();
                if (endCallback) {
                    endCallback();
                }
            },
            easeOutBack
        );
    }

    function tickCounter(v) {
        isCounterAnimation = true;

        if (!counterPrevTickValue) {
            counterPrevTickValue = counter;
        }
        counterDelta = v - counterPrevTickValue;
        counter += counterDelta;
        counterPrevTickValue = v;
    }

    function animCounterStop() {
        isCounterAnimation = false;
        counterDelta = 0;
        counterPrevTickValue = 0;

        // setTimeout(idle, 1000);
    }

    function animate(tickHook, startNum, endNum, durationMs, callback, easingEq) {
        easingEq = easingEq || easeOutExpo;
        const changeInNum = endNum - startNum,
            startTime = Date.now(),
            engine = function () {
                const now = Date.now(),
                    timeSpent = now - startTime,
                    timeNorm = timeSpent / durationMs,
                    completionNorm = easingEq(timeNorm),
                    newNum = startNum + completionNorm * changeInNum;

                if (timeSpent > durationMs) {
                    animationsMap.delete(`${startNum},${endNum},${durationMs}`);
                    if (callback) {
                        callback();
                    }
                }
                else {
                    tickHook(newNum);
                }
            }
        ;

        animationsMap.set(`${startNum},${endNum},${durationMs}`, engine);
    }

    /**
     * @see https://easings.net/#easeOutElastic
     * @param x
     * @return {number}
     */
    function easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;

        return x === 0 ?
               0 :
               x === 1 ?
               1 :
               Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    function easeLinear(x) {
        return x;
    }

    /**
     * @see https://easings.net/#easeInOutCubic
     * @param x
     * @return {number}
     */
    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    /**
     * @see https://easings.net/#easeOutBack
     * @param x
     * @return {number}
     */
    function easeOutBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    }

    /**
     * @see https://easings.net/#easeOutExpo
     * @param x
     * @return {number}
     */
    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    /**
     * @see https://easings.net/#easeInOutExpo
     * @param x
     * @return {number}
     */
    function easeInOutExpo(x) {
        return x === 0
               ? 0
               : x === 1
                 ? 1
                 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
                           : (2 - Math.pow(2, -20 * x + 10)) / 2;
    }

    /**
     * @see https://easings.net/#easeInOutSine
     * @param x
     * @return {number}
     */
    function easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }

    function array_shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}