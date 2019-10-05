const LINE_HEIGHT = 20;
const RADIUS = 5;
const COLOR = "blue";

function findElementInParent(target) {
  return [...target.parentElement.childNodes].indexOf(target);
}
function findPoint(points,coordinates) {
  return points.indexOf(points.find(i => {
    let rangeX = [i.x-RADIUS,i.x+RADIUS];
    let rangeY = [i.y-RADIUS,i.y+RADIUS];
    return (((coordinates.x >= rangeX[0])
      && (coordinates.x <= rangeX[1])) 
      && ((coordinates.y >= rangeY[0])
      && (coordinates.y <= rangeY[1])));
  }));
}
let Router = class {
  constructor(in_string,out_string) {
    //SETTING UP INTERNAL STRUCTURES
    this.routes = [];
    this.state = [false,false];
    this.inputs = in_string.split(",");
    this.outputs = out_string.split(",");
    //CREATING DOM ELEMENTS
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.ul_elts = [document.createElement("ul"),document.createElement("ul")];
    this.container = document.createElement("div");
    this.container.setAttribute("style","display:flex;");
    this.ul_elts[0].setAttribute("class","inputs");
    this.fillLists();
    this.container.append(this.ul_elts[0]);
    this.canvas.height =
      LINE_HEIGHT*(Math.max(this.inputs.length,this.outputs.length));
    this.container.append(this.canvas);
    this.container.append(this.ul_elts[1]);
    //DRAWING THINGS ON THE CANVAS
    this.computePoints();
    this.drawAgain();
    //Now let's add event listeners to track user interactions
      //ADDING
    this.ul_elts.map((ul,i) => {
      ul.addEventListener("click",(e) => {
        this.changeState(i,e.target,this.getReadableRoutes);
      });
    });
    this.canvas.addEventListener("click",(e) => {
      let point = this.findPointOnCanvas(e);
      point.map((e,i) => {
        if (e != -1) { this.changeState(i,e,this.getReadableRoutes); }
      })
    });
      //REMOVING
    this.ul_elts.map((ul,i) => {
      ul.addEventListener("contextmenu",(e) => {
        e.preventDefault();
        this.removeRoute(i,e.target,this.getReadableRoutes);
      });
    });
    this.canvas.addEventListener("contextmenu",(e) => {
      e.preventDefault();
      let point = this.findPointOnCanvas(e);
      point.map((e,i) => {
        if (e != -1) { this.removeRoute(i,e,this.getReadableRoutes); }
      });
    });
  }
  stateToPoints(state) {
    return [this.inputs[state[0]],this.outputs[state[1]]];
  }
  getReadableRoutes(to_log=false) {
    let readable = this.routes.map(e => this.stateToPoints(e).map(f => f.value));
    if (to_log) { console.info(readable); }
    return readable;
  }
  fillLists() {
    [this.inputs,this.outputs].map((array,i) => { 
        array.map(e => {
        let li = document.createElement("li");
        li.innerHTML = e;
        this.ul_elts[i].append(li);
      });
    });
  }
  computePoints() {
    let compute = (array,base_x) => {
      let y_span = this.canvas.height/array.length;
      return array.map((e,i) => ({value:e,x:base_x,y:0.5*y_span+i*y_span}));
    }
    this.inputs = compute(this.inputs,RADIUS);
    this.outputs = compute(this.outputs,this.canvas.width-RADIUS);
  }
  drawPoints() {
    this.context.fillStyle = COLOR;
    [this.inputs,this.outputs].map(f => {
      this.context.beginPath();
      f.map(e => {
        this.context.arc(e.x, e.y, RADIUS, 0, 2*Math.PI);
      });
      this.context.fill();
    });
  }
  drawBezier(input,output) {
    let controls = [
      {x:input.x+(output.x-input.x)/2,y:input.y+0.25*(output.y-input.y)},
      {x:input.x+(output.x-input.x)/2,y:input.y+0.75*(output.y-input.y)}
    ];
    this.context.beginPath();
    this.context.moveTo(input.x, input.y);
    this.context.bezierCurveTo(
      controls[0].x, controls[0].y,
      controls[1].x, controls[1].y,
      output.x, output.y
    );
    this.context.stroke();
  }
  drawAgain() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPoints();
    this.routes.map(e => this.drawBezier(...this.stateToPoints(e)));
  }
  changeState(element,target,callback) {
    if (typeof target === "object") {
      target = findElementInParent(target);
    }
    if (this.state[Number(!element)] !== false) {
      this.state[element] = target;
      if (typeof this.routes.find(e => e == this.state) === "undefined") {
        this.routes.push(this.state);
        callback.call(this,true);
      }
      this.state = [false,false];
      this.drawAgain();
    } else {
      this.state[element] = target;
    }
  }
  findPointOnCanvas(event,canvas) {
    let coords = {
      x:event.pageX - this.canvas.offsetLeft,
      y:event.pageY - this.canvas.offsetTop
    };
    return [this.inputs,this.outputs].map(e => findPoint(e,coords));
  }
  removeRoute(element,target,callback) {
    if (typeof target === "object") {
      target = findElementInParent(target);
    }
    let pre_length = this.routes.length;
    this.routes = this.routes.filter(e => e[element] != target);
    callback.call(this,true);
    if (this.routes.lenght != pre_length) { this.drawAgain(); }
  }
};
let route = new Router("comma,separated,values","again,comma,separated,values");
document.querySelector("main").append(route.container);