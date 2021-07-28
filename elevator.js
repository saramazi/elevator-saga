{
    init: function(elevators, floors) {
        console.log('debug with this console message');

        const ev = elevators[0];

        /**
         * Elevator의 이전 진행 상태
         * - stopped된 상태에서 이전 진행 상태를 확인할 수 없어서 등록함
         */
        let lastDirection = 'down';

        /**
         * floorButton 정보
         *
         * floor object에서 floorButton의 현재 상태를 확인할 수 없으므로 별도로 만듬
         */
        const floorButtons = [];
        for (let i = 0; i < floors.length; i += 1) {
            floorButtons.push({ down: false, up: false})
        }

        /**
         * Add floor on queue to stop
         * @param {number} floor 
         */
        const addQueue = (floor) => {
            const { destinationQueue } = ev;
            if (!destinationQueue.includes(floor)) destinationQueue.push(floor);

            const direction = getDirection();
            lastDirection = direction;
            switch (direction) {
                case 'up':
                    destinationQueue.sort();
                    break;
                case 'down':
                    destinationQueue.sort((a, b) => b - a);
                default:
            }

            ev.checkDestinationQueue();
        };

        /**
         * Change elevator up and down indicator
         */
        const changeIndicator = () => {
            const currentFloor = ev.currentFloor();
            const direction = getDirection()
            switch (direction) {
                case 'up':
                    ev.goingUpIndicator(true);
                    ev.goingDownIndicator(false);
                    floorButtons[currentFloor].up = false;
                    break;
                case 'down':
                    ev.goingUpIndicator(false);
                    ev.goingDownIndicator(true);
                    floorButtons[currentFloor].down = false;
                    break;
                case 'stopped':
                    // 정지 상태 = 방향 전환
                    if (lastDirection === 'down') { // down -> up
                        floorButtons.forEach((floorButton, idx) => {
                            if (floorButton.up) addQueue(idx);
                        });
                        floorButtons[currentFloor].up = false; // 현재층의 up 끔

                        // indicator
                        ev.goingUpIndicator(true);
                        ev.goingDownIndicator(ev.destinationQueue.length === 0);
                    } else if (lastDirection === 'up') { // up -> down
                        floorButtons.forEach((floorButton, idx) => {
                            if (floorButton.down) addQueue(idx);
                        });
                        floorButtons[currentFloor].down = false; // 현재층의 down 끔

                        // indicator
                        ev.goingUpIndicator(ev.destinationQueue.length === 0);
                        ev.goingDownIndicator(true);
                    } else {
                        alert('발생하면 안 됨');
                    }

                    break;
                default:
            }
        };

        const getDirection = () => {
            const { destinationQueue } = ev;          
            if (!destinationQueue.length) return "stopped";

            const currentFloor = ev.currentFloor();
            for (let i = 0; i < destinationQueue.length; i += 1) {
                const nextFloor = destinationQueue[i];
                if (currentFloor < nextFloor) return "up";
                if (currentFloor > nextFloor) return "down";
            }
            return "stopped";
        }

        /**
         * Set floor up or down button
         * @param {number} floorNum
         * @param {"up"|"down"} buttonDirection 
         */
        const setFloorButton = (floorNum, buttonDirection) => {
            const evDirection = getDirection()
            if (ev.currentFloor() === floorNum) {
                // do nothing
            } else {
                floorButtons[floorNum][buttonDirection] = true;

                const currentFloor = ev.currentFloor();
                switch (`${evDirection}-${buttonDirection}`) {
                    case 'up-up':
                    case 'stopped-up':
                        if (currentFloor < floorNum) addQueue(floorNum);
                        break;
                    case 'down-up':
                        // 예를 들어, 3층에서 1층을 목표로 내려가고 있는데 0층에서 올라가고자 할 때
                        break;
                    case 'down-down':
                    case 'stopped-down':
                        if (currentFloor > floorNum) addQueue(floorNum);
                        break;
                    case 'up-down':
                        // 예를 들어, 1층에서 2층을 목표로 올라가고 있는데 4층에서 내려가고자 할 때
                        break;
                    default:
                }
            }
        }

        /**
         * Try to go to target floor
         * 
         * **가능**하다면 target floor에 정지하도록 queue에 등록 요청함
         * - 현재 올라가고 있는데 아래 층을 누르는 등의 동작은 무시함
         * @param {number} targetFloor
         */
        const onElevatorButtonPress = (targetFloor) => {
            const direction = getDirection()
            const currentFloor = ev.currentFloor();
            if (direction === 'up' && targetFloor > currentFloor) {
                addQueue(targetFloor);
            } else if (direction === 'down' && targetFloor < currentFloor) {
                addQueue(targetFloor);
            } else if (direction === 'stopped') {
                addQueue(targetFloor);
            }
        }

        ev.on('floor_button_pressed', onElevatorButtonPress);

        ev.on('stopped_at_floor', changeIndicator);

        floors.forEach((floor) => {
            floor.on('down_button_pressed', () => {
                setFloorButton(floor.floorNum(), "down");
            });
            floor.on('up_button_pressed', () => {
                setFloorButton(floor.floorNum(), "up");
            });
        })
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}