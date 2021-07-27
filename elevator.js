{
    init: function(elevators, floors) {
        console.log('debug with this console message');
        const ev = elevators[0];

        const floorButtons = [];
        for (let i = 0; i < floors.length; i += 1) {
            floorButtons.push({ down: false, up: false})
        }

        const addQueue = (floor) => {
            const { destinationQueue } = ev;
            destinationQueue.push(floor);

            const direction = ev.destinationDirection();
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

        const changeIndicator = () => {
            const { destinationQueue } = ev;
            const currentFloor = ev.currentFloor();
            if (destinationQueue.length) {
                const direction = ev.destinationDirection();
                const targetFloor = destinationQueue[0];

                if (currentFloor < targetFloor) {
                    ev.goingUpIndicator(true);
                    ev.goingDownIndicator(false);
                    floorButtons[currentFloor].up = false;
                } else if (currentFloor > targetFloor) {
                    ev.goingUpIndicator(false);
                    ev.goingDownIndicator(true);
                    floorButtons[currentFloor].down = false;
                }
            } else {
                let targetFloor = -1;
                for (let i = 0; i < floorButtons.length; i += 1) {
                    if (i < currentFloor && floorButtons[i].up) {
                        targetFloor = i;
                        break;
                    } else if (i > currentFloor && floorButtons[i].down) {
                        targetFloor = i;
                        break;
                    }
                }

                if (targetFloor >= 0) {
                    addQueue(targetFloor);
                    ev.goingUpIndicator(currentFloor < targetFloor);
                    ev.goingDownIndicator(currentFloor > targetFloor);
                } else {
                    ev.goingUpIndicator(true);
                    ev.goingDownIndicator(true);
                }
            }

        };

        const tryToGo = (targetFloor) => {
            const direction = ev.destinationDirection();
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
                const floorNum = floor.floorNum();
                if (ev.currentFloor() !== floorNum) {
                    floorButtons[floorNum].down = true;
                    tryToGo(floorNum);
                }
            });
            floor.on('up_button_pressed', () => {
                const floorNum = floor.floorNum();
                if (ev.currentFloor() !== floorNum) {
                    floorButtons[floorNum].up = true;
                    tryToGo(floorNum);
                }
            });
        })
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}