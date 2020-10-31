const keycodeLib = require('keycode')
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
import Joystick from './joy'
let engine;
let entities = {};
let matchTime = 30;
let joy;
var joyDiv;
var gameEnded = false;

var astronautImg = require('./images/astronaut.png');
var shipImg = require('./images/ship.png');
const mapWidth = innerWidth;
const mapHeight = innerHeight - (isMobile ? 20 : 10);

function countBoundPassengers() {
    return Object.values(entities).filter((e) => e.nickname == 'Passenger' && e.boundToShip).length;
}

function Link(sketch, a, b) {
    const $this = {};
    $this.id = makeid(10);
    $this.nickname = 'Link';
    $this.body = Matter.Constraint.create({
        bodyA: a.body,
        bodyB: b.body,
        length: 70,
        stiffness: 0.1,
    });
    Matter.World.add(engine.world, $this.body);
    Matter.Body.setPosition(b.body, {
        x: a.body.position.x - 20,
        y: a.body.position.y - 20,
    });
    $this.a = a;
    $this.b = b;
    $this.a.links.push($this);
    $this.b.links.push($this);

    $this.show = () => {
        sketch.push();
        sketch.translate($this.body.bodyA.position.x, $this.body.bodyA.position.y);
        sketch.fill(255);
        sketch.stroke(255);
        sketch.strokeWeight(2);
        sketch.line(0, 0, $this.body.bodyB.position.x - $this.body.bodyA.position.x, $this.body.bodyB.position.y - $this.body.bodyA.position.y)
        sketch.pop();
    };
    $this.update = () => { }
    $this.unbind = () => {
        $this.a.links = $this.a.links.filter(l => l != $this);
        $this.b.links = $this.b.links.filter(l => l != $this);
        $this.a.boundToShip = false;
        $this.a.boundToShip = false;
    }

    entities[$this.id] = $this;
    return $this;
}

function Ship(sketch) {
    const $this = {};
    $this.links = [];
    $this.nickname = 'Ship';
    $this.body = Matter.Bodies.rectangle(100, 100, 32, 53);
    $this.id = makeid(10);
    $this.body.id = $this.id;
    Matter.World.add(engine.world, $this.body);
    $this.show = () => {
        sketch.push();
        sketch.translate($this.body.position.x, $this.body.position.y);
        sketch.rotate($this.body.angle * 180 / Math.PI);
        sketch.fill(255);
        sketch.image(shipImg, 0, 0, 64, 64);
        // sketch.rect(0, 0, 64, 64)
        sketch.pop();
    };

    $this.update = () => {
        // console.log(this.body.position)
    }

    entities[$this.id] = $this;

    return $this;
};

function positiveOrNegative() {
    return Math.random() > 0.5 ?  -1 : 1;
}

function Passenger(sketch) {
    const $this = {};
    $this.links = [];
    $this.boundToShip = false;
    $this.nickname = 'Passenger';
    $this.body = Matter.Bodies.rectangle(sketch.random() * mapWidth, sketch.random() * mapHeight, 20, 32);
    Matter.Body.applyForce($this.body, $this.body.position, {
        x: Math.random() * 0.00005 * positiveOrNegative(),
        y: Math.random() * 0.00005 * positiveOrNegative()
    });
    $this.id = makeid(36);
    $this.body.id = $this.id;
    Matter.World.add(engine.world, $this.body);
    $this.show = () => {
        sketch.push();
        sketch.translate($this.body.position.x, $this.body.position.y);
        sketch.rotate($this.body.angle * 180 / Math.PI);
        sketch.fill(200);
        sketch.image(astronautImg, 0, 0, 20, 32)
        sketch.pop();
    };

    $this.update = () => {
        // console.log($this.body.position)
    }

    entities[$this.id] = $this;

    return $this;
};

const s = (sketch) => {
    engine = Matter.Engine.create();
    engine.world.gravity.y = 0;
    Matter.World.add(engine.world, Matter.Bodies.rectangle(-10, -10, 10, 9999, { isStatic: true }));
    Matter.World.add(engine.world, Matter.Bodies.rectangle(-10, -10, 9999, 10, { isStatic: true }));
    Matter.World.add(engine.world, Matter.Bodies.rectangle(mapWidth, -10, 10, 9999, { isStatic: true }));
    Matter.World.add(engine.world, Matter.Bodies.rectangle(mapWidth, mapHeight, 9999, 10, { isStatic: true }));

    sketch.preload = () => {
        shipImg = sketch.loadImage(shipImg);
        astronautImg = sketch.loadImage(astronautImg);
    };

    sketch.setup = () => {
        const canvas = sketch.createCanvas(mapWidth, mapHeight);
        sketch.imageMode(sketch.CENTER);
        sketch.rectMode(sketch.CENTER);
        sketch.angleMode(sketch.DEGREES);
        canvas.elt.style.border = '1 px solid #fff';
        if (isMobile) {
            joy = new Joystick('joyDiv', {
                internalFillColor: '#ccc',
                internalStrokeColor: '#ccc',
                externalStrokeColor: '#ccc',
                width: 100,
                height: 100,
            });
            joyDiv = document.getElementById('joyDiv');
            joyDiv.style.display = 'flex';
        }
    };

    const commands = {
        down: false,
        up: false,
        left: false,
        right: false,
        boost: false
    }
    const defaultCommands = { ...commands };

    if (isMobile)
        setInterval(function () {
            Object.keys(defaultCommands).forEach(k => {
                commands[k] = defaultCommands[k];
            });

            console.log(joy.GetDir());

            switch (joy.GetDir()) {
                case 'N':
                    commands.up = true;
                    break;
                case 'NE':
                    commands.up = true;
                    commands.right = true;
                    break;
                case 'NW':
                    commands.up = true;
                    commands.left = true;
                    break;
                case 'E':
                    commands.right = true;
                    break;
                case 'S':
                    commands.down = true;
                    break;
                case 'SE':
                    commands.down = true;
                    commands.right = true;
                    break;
                case 'SW':
                    commands.down = true;
                    commands.left = true;
                    break;
                case 'W':
                    commands.left = true;
                    break;
            }
        }, 50);

    const keyPressedMapping = {
        a: 'left',
        d: 'right',
        w: 'up',
        s: 'down',
        space: 'boost'
    }
    if (!isMobile) {
        sketch.keyReleased = () => {
            commands[keyPressedMapping[keycodeLib(sketch.keyCode)]] = true;
        }

        sketch.keyPressed = () => {
            commands[keyPressedMapping[keycodeLib(sketch.keyCode)]] = true;

        }
    }

    var lastTime = Date.now();
    var force = 0.00004;
    var boostedForce = 0.00008;
    var nextPassengerTime = 0;
    var passengerInterval = 1;
    var time = 0;

    const ship = Ship(sketch);
    entities[ship.id] = ship;

    window.entities = entities;

    Matter.Events.on(engine, 'collisionStart', function (event) {
        event.pairs.forEach(pair => {
            const a = entities[pair.bodyA.id];
            const b = entities[pair.bodyB.id];

            if (!a || !b)
                return;

            const eventObjects = {
                Passenger: [],
                Ship: []
            };

            eventObjects[a.nickname].push(a);
            eventObjects[b.nickname].push(b);

            var newLink;
            if (eventObjects.Passenger.length == 1 && eventObjects.Ship.length == 1) {
                const passenger = eventObjects.Passenger[0];
                const ship = eventObjects.Ship[0];

                if (passenger.links.length != 0 && ship.links.includes(passenger.links[0])) {
                    // console.log('ended')
                    gameEnded = true;
                    return;
                }

                if (ship.links.length > 0) {
                    // const firstLink = ship.links.splice(0, 1)[0];
                    // const firstPassenger = firstLink.b;
                    const lastPassenger = ship.links[ship.links.length - 1].b;

                    // Matter.World.remove(engine.world, firstLink.body);
                    // firstLink.unbind();
                    // delete entities[firstLink.id];

                    // ship.links.unshift(Link(sketch, ship, passenger), Link(sketch, firstPassenger, passenger));
                    ship.links.push(Link(sketch, lastPassenger, passenger));

                    // Matter.Body.setPosition(passenger.body, {
                    //     x: firstLink.b.body.position.x,
                    //     y: firstLink.b.body.position.y,
                    // });

                    // firstPassenger.boundToShip = true;
                    passenger.boundToShip = true;
                } else {
                    newLink = Link(sketch, ship, passenger);
                    passenger.boundToShip = true;
                }
                // ship.links.push(newLink);
            }

            if (eventObjects.Passenger.length == 2 && eventObjects.Passenger.filter(p => p.links.length == 0).length > 0) {
                const deletedObjects = []
                eventObjects.Passenger.forEach(p => {
                    p.links.forEach(link => {
                        if (deletedObjects.includes(link))
                            return;

                        deletedObjects.push(link);
                        const shipLinkIndex = ship.links.indexOf(link);

                        try {
                            Matter.World.remove(engine.world, link.body);
                            link.unbind();
                            delete entities[link.id];
                            console.log('deleted')
                        } catch (e) {
                            console.log('not deleted')
                        }

                        ship.links.map(innerLink => {
                            innerLink.unbind();
                            Matter.World.remove(engine.world, innerLink.body);
                            delete entities[innerLink.id];
                        });
                        ship.links = []
                    });
                    p.links = [];
                })
            }
        })
    });
    sketch.draw = () => {
        const now = Date.now();
        const dt = now - lastTime;
        lastTime = now;
        time += dt / 1000;
        const remainingTime = (matchTime - time);

        if (remainingTime > 0 && !gameEnded) {
            // var targetAngle = Matter.Vector.angle(ship.body.position, {
            //     x: sketch.mouseX,
            //     y: sketch.mouseY
            // });

            if (time >= nextPassengerTime) {
                const passenger = new Passenger(sketch);
                nextPassengerTime = time + passengerInterval;
            }

            if (!isMobile)
                Object.keys(keyPressedMapping).forEach(mappingKey => {
                    commands[keyPressedMapping[mappingKey]] = sketch.keyIsDown(keycodeLib(mappingKey));
                })
            const resultForce = commands.boost ? boostedForce : force;

            if (commands.up) {
                Matter.Body.setAngle(ship.body, 0 / 180 * Math.PI);
                Matter.Body.applyForce(ship.body, ship.body.position, {
                    x: 0,
                    y: -resultForce
                });
            }

            if (commands.left) {
                Matter.Body.setAngle(ship.body, -90 / 180 * Math.PI);
                Matter.Body.applyForce(ship.body, ship.body.position, {
                    x: -resultForce,
                    y: 0
                });
            }

            if (commands.right) {
                Matter.Body.setAngle(ship.body, 90 / 180 * Math.PI);
                Matter.Body.applyForce(ship.body, ship.body.position, {
                    x: resultForce,
                    y: 0
                });
            }

            if (commands.down) {
                Matter.Body.setAngle(ship.body, 180 / 180 * Math.PI);
                Matter.Body.applyForce(ship.body, ship.body.position, {
                    x: 0,
                    y: resultForce
                });
            }

            Matter.Engine.update(engine, 1000 / dt);

            sketch.background(0);
            Object.keys(entities).forEach(e => {
                entities[e].update();
                entities[e].show();
            })
            const passengersBoundToShip = countBoundPassengers();
            sketch.fill(255)
            sketch.textAlign(sketch.LEFT);
            sketch.textSize(20);
            sketch.text(`Passengers: ${passengersBoundToShip}`, 20, 40)

            sketch.fill(255)
            sketch.textAlign(sketch.CENTER);
            sketch.textSize(32);
            sketch.text(`${remainingTime.toFixed(1)}`, mapWidth / 2, 60)
        } else {
            if (isMobile)
                joyDiv.style.display = 'none';
            sketch.background(0);
            const passengersBoundToShip = countBoundPassengers();
            console.log(passengersBoundToShip)
            sketch.fill(255)
            sketch.textAlign(sketch.CENTER);
            sketch.textSize(60);
            sketch.text(`SCORE`, mapWidth / 2, mapHeight / 2)
            sketch.textSize(40);
            sketch.text(`${passengersBoundToShip}`, mapWidth / 2, mapHeight / 2 + 50)
            var button = sketch.createButton('Play again!');
            button.position(mapWidth / 2 - 50, mapHeight / 2 + 100);
            button.elt.addEventListener('click', () => {
                location.reload();
            });
            sketch.noLoop();
        }
    }
};

let myp5 = new p5(s);

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}