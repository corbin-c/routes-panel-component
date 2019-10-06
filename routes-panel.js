const LINE_HEIGHT = 20;
const WIDTH = 100;
const RADIUS = 5;
const COLOR = "#33AAFF";

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
class Router extends HTMLElement {
  constructor() {
    super();
    //SETTING UP INTERNAL STRUCTURES
    this.routes = [];
    this.state = [false,false];
    try {
      this.inputs = this.getAttribute("inputs").split(",");
      this.outputs = this.getAttribute("outputs").split(",");
      this.routes = this.getAttribute("routes")
        .split("|")
        .map(e => {
          let route = e.split("-");
          return [this.inputs.indexOf(route[0]),this.outputs.indexOf(route[1])];
        });
    } catch {
      console.warn("missing attribute when initiating element");
    }
    //CREATING DOM ELEMENTS
    const shadow = this.attachShadow({mode: "open"});
    let style = document.createElement("style");
    style.textContent = `
* {
  margin: 0;
  padding: 0;
  font-family: Sans;
  box-sizing: border-box;
}
figure {
  display: flex;
}
li {
  line-height: 20px;
  width: 100%;
  height: `+LINE_HEIGHT+`px;
}
.inputs {
  text-align: right;
}
ul {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: flex-start;
  list-style: none;
}`;
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.ul_elts = [document.createElement("ul"),document.createElement("ul")];
    this.container = document.createElement("figure");
    this.ul_elts[0].setAttribute("class","inputs");
    this.fillLists();
    this.container.append(this.ul_elts[0]);
    this.canvas.height =
      LINE_HEIGHT*(Math.max(this.inputs.length,this.outputs.length));
    this.canvas.width = WIDTH;
    this.container.append(this.canvas);
    this.container.append(this.ul_elts[1]);
    shadow.appendChild(style);
    shadow.appendChild(this.container);
    //DRAWING THINGS ON THE CANVAS
    this.computePoints();
    this.drawAgain();
    //Now let's add event listeners to track user interactions
      //ADDING
    this.ul_elts.map((ul,i) => {
      ul.addEventListener("click",(e) => {
        this.changeState(i,e.target,this.setOutputAttributes);
      });
    });
    this.canvas.addEventListener("click",(e) => {
      let point = this.findPointOnCanvas(e);
      point.map((e,i) => {
        if (e != -1) { this.changeState(i,e,this.setOutputAttributes); }
      })
    });
      //REMOVING
    this.ul_elts.map((ul,i) => {
      ul.addEventListener("contextmenu",(e) => {
        e.preventDefault();
        this.removeRoute(i,e.target,this.setOutputAttributes);
      });
    });
    this.canvas.addEventListener("contextmenu",(e) => {
      e.preventDefault();
      let point = this.findPointOnCanvas(e);
      point.map((e,i) => {
        if (e != -1) { this.removeRoute(i,e,this.setOutputAttributes); }
      });
    });
  }
  setOutputAttributes() {
    this.setAttribute("routes",this.getReadableRoutes()
      .map(e => e.join("-"))
      .join("|"));
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
      if (typeof this.routes.find(e => ((e[0] == this.state[0])
        && (e[1] == this.state[1]))) === "undefined") {
        this.routes.push(this.state);
        callback.call(this);
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
    callback.call(this);
    if (this.routes.lenght != pre_length) { this.drawAgain(); }
  }
};
customElements.define("routes-panel", Router);