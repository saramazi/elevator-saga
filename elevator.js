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
        const addToDestinationQueue = (floor) => {
            const { destinationQueue } = ev;
            if (!destinationQueue.includes(floor)) destinationQueue.push(floor);

            const direction = getEvDirection();
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

        const getEvDirection = () => {
            const { destinationQueue } = ev;          
            if (!destinationQueue.length) return 'stopped';

            const currentFloor = ev.currentFloor();
            for (let i = 0; i < destinationQueue.length; i += 1) {
                const nextFloor = destinationQueue[i];
                if (currentFloor < nextFloor) return 'up';
                if (currentFloor > nextFloor) return 'down';
            }
            return 'stopped';
        }

        /**
         * 엘리베이터 내부 버튼 누름
         * 
         * Indicator에 따라 누를 수 있는 버튼이 정해져 있음
         * 예를 들어, UpIndicator만 켜져있으면 내려가는 현재 층 이하 버튼 안 눌러짐
         * @param {number} targetFloor
         */
         const onEvBtnPress = (targetFloor) => {
            addToDestinationQueue(targetFloor); // button press가 가능하다면 해당 층으로 가는 direction이거나 정지해있는 상태임
        }

        /**
         * 엘리베이터 정지했을 때
         * 
         * 최초 시작할 때 || 엘리베이터가 움직이다가 정지했을 때
         */
        const onEvStop = () => {
            const currentFloor = ev.currentFloor();
            const direction = getEvDirection()
            switch (direction) {
                case 'up':
                case 'down':
                    setEvIndicator(direction);
                    floorButtons[currentFloor][direction] = false;
                    break;
                case 'stopped':
                    // floorButtons 정보 기반으로 올라갈 지 내려갈지 결정해야 함
                    // - 무식하게 0층부터 확인
                    // - 다음 direction은 floorButton이 press된 층과 현재 층과의 관계로 계산
                    let hasDirection = false;
                    for (let i = 0; i < floorButtons.length; i += 1) {
                        if (floorButtons[i].up || floorButtons[i].down) {                               
                            /**
                             * elevator의 다음 방향
                             * - up, down, any
                             * - any는 올라갈 수도 내려갈 수도 있다는 의미
                             */
                            if (i < currentFloor) {
                                setEvIndicator('up');
                                hasDirection = true;
                                break;
                            } else if (i > currentFloor) {
                                setEvIndicator('down');
                                hasDirection = true;
                                break;
                            } else { // 현재 층에 정지한 상태
                                if (floorButtons[i].up) {
                                    setEvIndicator('up');
                                    floorButtons[currentFloor].up = false;
                                } else if (floorButtons[i].down) {
                                    setEvIndicator('down');
                                    floorButtons[currentFloor].down = false;
                                }
                            }
                        }
                    }
                    if (!hasDirection) {
                        setEvIndicator('any');
                    }
                    break;
                default:
            }
        };

        /**
         * Set floor up or down button
         * @param {number} floorNum
         * @param {'up'|'down'} buttonDirection 
         */
        const onFloorBtnPress = (floorNum, buttonDirection) => {
            const evDirection = getEvDirection()

            // 올라가고 있는데 다시 올라가는 버튼이 눌러질까?
            if (floorNum === ev.currentFloor() && buttonDirection === evDirection) {
                alert('올라가고 있는데 다시 올라가는 버튼이 눌러진다!!!');
            }

            

            if (ev.currentFloor() === floorNum) {
                // do nothing
            } else {
                floorButtons[floorNum][buttonDirection] = true;

                const currentFloor = ev.currentFloor();
                switch (`${evDirection}-${buttonDirection}`) {
                    case 'up-up':
                    case 'stopped-up':
                        if (currentFloor < floorNum) addToDestinationQueue(floorNum);
                        break;
                    case 'down-up':
                        // 예를 들어, 3층에서 1층을 목표로 내려가고 있는데 0층에서 올라가고자 할 때
                        break;
                    case 'down-down':
                    case 'stopped-down':
                        if (currentFloor > floorNum) addToDestinationQueue(floorNum);
                        break;
                    case 'up-down':
                        // 예를 들어, 1층에서 2층을 목표로 올라가고 있는데 4층에서 내려가고자 할 때
                        break;
                    default:
                }
            }
        }

        /**
         * 엘레베이터의 방향 indicator 설정
         * @param {'up'|'down','any'} direction 
         */
        const setEvIndicator = (direction) => {
            switch (direction) {
                case 'up':
                    ev.goingUpIndicator(true);
                    ev.goingDownIndicator(false);
                    break;
                case 'down':
                    ev.goingUpIndicator(false);
                    ev.goingDownIndicator(true);
                    break;
                case 'any':
                    ev.goingUpIndicator(true);
                    ev.goingDownIndicator(true);
                    break;
                default:
            }
        }

        ev.on('floor_button_pressed', onEvBtnPress);

        ev.on('stopped_at_floor', onEvStop);

        floors.forEach((floor) => {
            floor.on('down_button_pressed', () => {
                onFloorBtnPress(floor.floorNum(), 'down');
            });
            floor.on('up_button_pressed', () => {
                onFloorBtnPress(floor.floorNum(), 'up');
            });
        })
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
