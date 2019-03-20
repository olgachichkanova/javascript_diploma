'use strict'
//Vector
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x; 
    this.y = y;  
  }
  
  plus(vector) {
    if(!(vector instanceof Vector)) {
      throw new Error (`Можно прибавлять к вектору только вектор типа Vector`);
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }
   
  times(coefficient) {
     return new Vector(this.x * coefficient, this.y * coefficient);
  }
}

//Actor
class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if((!(position instanceof Vector)) || (!(size instanceof Vector)) || (!(speed instanceof Vector))) {
      throw new Error (`Можно передавать только вектор типа Vector`);
    }
    this.pos = position;
    this.size = size;
    this.speed = speed;
  }
  act() {

  }
  get left() {
    return this.pos.x;
  }
  get top() {
    return this.pos.y;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get type() {
    return `actor`;
  }
  isIntersect(actor) {
    if(!(actor instanceof Actor)) {
      throw new Error (`Можно передавать только движущийся объект типа Actor`);
    }
    if(actor === undefined) {
      throw new Error (`Actor не может быть undefined`);
    }
    if (actor === this) {
      return false;
    }
        if (actor.right <= this.left) {
        return false;
      } else if (actor.left >= this.right) {
        return false;
      } else if (actor.bottom <= this.top) {
        return false;
      } else if (actor.top >=this.bottom) {
        return false;
      } 
        return true;

  }
}

class Level {
  constructor (grid, actors) {
    this.grid = grid;
    this.actors = actors;
    if (actors !== undefined) {
      this.player = actors.filter(actor => actor.type === 'player')[0];
    };
    if (grid === undefined) {
      this.height = 0;
      this.width = 0;
    } else {
      this.height = this.grid.length;
      let max = 0;
      grid.forEach(function(line){
        if (line.length > max) {
          max = line.length;
        }
      });
      this.width = max;
    }

    this.status = null;
    this.finishDelay = 1;
  }
 
 
  isFinished () {
    if ((this.status !== null) && (this.finishDelay < 0)) {
      return true;
    } else {
      return false;
    }
    
  }

  actorAt(actor) {
    if(actor === undefined) {
      throw new Error (`Actor не может быть undefined`);
    }
    if(!(actor instanceof Actor)) {
      throw new Error (`Можно передавать только движущийся объект типа Actor`);
    }
      if ((this.grid === undefined) && (this.actors === undefined)) {
        return undefined;
      }
    let intersectingElements = this.actors.filter(element => actor.isIntersect(element)); 
    if (intersectingElements.length > 0) {
      return intersectingElements[0];
    } else {
      return undefined;
    }
  }

  obstacleAt(position, size) {
    if ((!(position instanceof Vector)) || (!(size instanceof Vector))) {
      throw new Error (`Можно передавать только вектор типа Vector`);
    }
    let actor = new Actor (position, size);
    if (actor.bottom > this.height){
      return 'lava';
    } else if ((actor.top < 0) || (actor.left < 0) || (actor.right > this.width)) {
      return 'wall';
    } 
    let left = Math.floor(actor.left);
    let right = Math.ceil(actor.right);
    let top = Math.floor(actor.top);
    let bottom = Math.ceil(actor.bottom);
    
    for (let j = top; j < bottom; j++) {
      for (let i = left; i < right; i++) {
        if (this.grid[j][i] === 'lava') {
          return 'lava';
        }  
        if (this.grid[j][i] === 'wall') {
          return 'wall';
        }
      }
    }
    return undefined;
  }
  removeActor(actor) {
    let i = this.actors.indexOf(actor);
    if (i < 0) {
      return;
    }
    this.actors.splice(i, 1);
  }
  noMoreActors (actorType) {
    if (this.actors === undefined) {
      return true;
    }
    if (this.actors.length === 0) {
      return true;
    }
    let results = this.actors.filter(element => element.type === actorType);
    if (results.length === 0) {
      return true;
    } else {
      return false;
    }
  }
  playerTouched(obstacle, actor) {
    if ((obstacle === 'lava') || (obstacle === 'fireball')) {
          return this.status = 'lost';
        } else if ((obstacle === 'coin') && (actor instanceof Actor)) {
          this.removeActor(actor);
        }
    if (this.noMoreActors('coin') === true) {
      return this.status = 'won';
    }
  }  
}

class LevelParser {
  constructor (dict) {
    this.dict = dict;
  }

  actorFromSymbol(symbol) {
    if (symbol === undefined) {
      return undefined;
    }
    let newActor;
    try {
      newActor = new this.dict[symbol]();
    } catch (err) {
      return undefined;
    }
    if (!(newActor instanceof Actor)) {
      return undefined;
    }
    return this.dict[symbol];
  }
  obstacleFromSymbol(symbol) {
    if (symbol === 'x') {
      return 'wall';
    } else if (symbol === '!') {
      return 'lava';
    } else {
      return undefined;
    }
  }
  
  createGrid(stringsArray) {
    let resultArray = [];
    stringsArray.forEach(function(item) {
      if ((item === undefined) || (item === '')) {
        resultArray.push([]);
      } else {
        resultArray.push(item.split('').map(element => this.obstacleFromSymbol(element)));
        // let result = item.split('').map(function(element){
        //   return this.obstacleFromSymbol(element);
        // }, this);
        // resultArray.push(result);
      }
      
    }, this);
    return resultArray;
  }
  createActors(stringsArray = []) {
    if (this.dict === undefined) {
        return [];
    }
    const resultArray = [];
    stringsArray.forEach((symbolRow, j) => symbolRow.split('').forEach((symbol, i) => {
            let result = this.actorFromSymbol(symbol);
            if (result !== undefined) {
                let obj = new result(new Vector(i, j));
                if (obj instanceof Actor) {
                    resultArray.push(obj);
                }
            }
    }));
    return resultArray;
}
  parse(stringsArray) {
    let grid = this.createGrid(stringsArray);
    let actors = this.createActors(stringsArray);
    return new Level(grid, actors);
  }
}



class Fireball extends Actor {
  constructor (position, speed) {
    super(position, undefined, speed);
    this.size = new Vector(1, 1);
  }
  get type(){
    return 'fireball';
  }
  getNextPosition(time = 1) {
    let x = this.pos.x + (this.speed.x * time);
    let y = this.pos.y + (this.speed.y * time);
    return new Vector(x, y);
  }
  handleObstacle(){
      this.speed = this.speed.times(-1);
  }
  act(time, level) {
    let newPosition = this.getNextPosition(time);
    if (level.obstacleAt(newPosition, this.size) !== undefined) {
      this.handleObstacle();
    } else {
      this.pos = this.getNextPosition(time);
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor (position) {
    super (position);
    this.size = new Vector (1, 1);
    this.speed = new Vector (2, 0);
  }
}
class VerticalFireball extends Fireball {
  constructor (position) {
    super (position);
    this.size = new Vector (1, 1);
    this.speed = new Vector (0, 2);
  }
}

class FireRain extends Fireball {
  constructor (position) {
    super (position);
    this.initialPos = new Vector(this.pos.x, this.pos.y);
    this.size = new Vector (1, 1);
    this.speed = new Vector (0, 3);
  }
  handleObstacle(){
    this.pos = new Vector (this.initialPos.x, this.initialPos.y);
  }
}

class Coin extends Actor {
  constructor(position) {
    super(position);
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
    this.initialPos = this.pos;
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = (Math.random() * (2 * Math.PI - 0) + 0);
  }
  
  get type() {
    return 'coin';
  }
  updateSpring(time = 1) {
    this.spring = this.spring + (this.springSpeed * time);
  }
  
  getSpringVector() {
    let x = 0;
    let y = Math.sin(this.spring) * this.springDist;
    return new Vector (x, y);
  }
  getNextPosition(time = 1) {
    let spring = this.updateSpring(time);
    let springVector = this.getSpringVector(spring);
    let x = this.pos.x;
    let y = this.pos.y + springVector.y;
    return this.initialPos.plus(springVector);
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor (position) {
    super (position);
    this.pos.x = this.pos.x + 0;
    this.pos.y = this.pos.y + (-0.5);
    this.size = new Vector (0.8, 1.5);
  }
  get type() {
    return 'player';
  }
}

const schemas = [
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |xxx       w         ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @    *  xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "     v                 ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  |                    ",
    "  o                 o  ",
    "  x               = x  ",
    "  x          o o    x  ",
    "  x  @       xxxxx  x  ",
    "  xxxxx             x  ",
    "      x!!!!!!!!!!!!!x  ",
    "      xxxxxxxxxxxxxxx  ",
    "                       "
  ],
  [
    "        |           |  ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "     |                 ",
    "                       ",
    "         =      |      ",
    " @ |  o            o   ",
    "xxxxxxxxx!!!!!!!xxxxxxx",
    "                       "
  ],
  [
    "                       ",
    "                       ",
    "                       ",
    "    o                  ",
    "    x      | x!!x=     ",
    "         x             ",
    "                      x",
    "                       ",
    "                       ",
    "                       ",
    "               xxx     ",
    "                       ",
    "                       ",
    "       xxx  |          ",
    "                       ",
    " @                     ",
    "xxx                    ",
    "                       "
  ], [
    "   v         v",
    "              ",
    "         !o!  ",
    "              ",
    "              ",
    "              ",
    "              ",
    "         xxx  ",
    "          o   ",
    "        =     ",
    "  @           ",
    "  xxxx        ",
    "  |           ",
    "      xxx    x",
    "              ",
    "          !   ",
    "              ",
    "              ",
    " o       x    ",
    " x      x     ",
    "       x      ",
    "      x       ",
    "   xx         ",
    "              "
  ]
];
const actorDict = {
  '@': Player,
  '=': HorizontalFireball,
  'o': Coin,
  'v': FireRain,
  '|': VerticalFireball
}

const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
// const parser = new LevelParser(actorDict);
//   let levels = loadLevels()
//     .then(JSON.parse)
//     .then(levels => runGame(levels, parser, DOMDisplay)
//     .then(() => alert('Вы выиграли!')));