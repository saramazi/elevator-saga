{
    init: function(elevators, floors) {
        console.log('debug with this console message');

        const ev = elevators[0];

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
                    const targetFloors = [];

                    // 올라가는게 우선
                    for (let i = currentFloor + 1; i < floorButtons.length; i += 1) {
                        if (floorButtons[i].up) targetFloors.push(i);
                    }
                    if (targetFloors.length) {
                        targetFloors.forEach((targetFloor) => addQueue(targetFloor));

                        ev.goingUpIndicator(true);
                        ev.goingDownIndicator(false);
                        floorButtons[currentFloor].up = false;
                        break;
                    }

                    // 올라가는게 없다면 내려감
                    for (let i = currentFloor - 1; i >= 0; i -= 1) {
                        if (floorButtons[i].down) targetFloors.push(i);
                    }
                    if (targetFloors.length) {
                        targetFloors.forEach((targetFloor) => addQueue(targetFloor));
                        ev.goingUpIndicator(false);
                        ev.goingDownIndicator(true);

                        ev.goingUpIndicator(true);
                        ev.goingDownIndicator(false);
                        floorButtons[currentFloor].down = false;
                    } else {
                        if (floorButtons[currentFloor].up) {
                            ev.goingUpIndicator(true);
                            ev.goingDownIndicator(false);
                            floorButtons[currentFloor].up = false;
                        } else if (floorButtons[currentFloor].down) {
                            ev.goingUpIndicator(false);
                            ev.goingDownIndicator(true);
                            floorButtons[currentFloor].down = false;
                        } else {
                            ev.goingUpIndicator(true);
                            ev.goingDownIndicator(true);
                        }
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
         * @param {"up"|"down"} direction 
         */
        const setFloorButton = (floorNum, direction) => {
            const currentDirection = getDirection()
            if (ev.currentFloor() !== floorNum ||
                (currentDirection !== "stopped" && currentDirection !== direction)) {
                floorButtons[floorNum][direction] = true;
                tryToGo(floorNum);
            }
        }

        /**
         * Try to go to target floor
         * 
         * **가능**하다면 target floor에 정지하도록 queue에 등록 요청함
         * - 현재 올라가고 있는데 아래 층을 누르는 등의 동작은 무시함
         * @param {number} targetFloor
         */
        const tryToGo = (targetFloor) => {
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

        ev.on('floor_button_pressed', tryToGo);

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