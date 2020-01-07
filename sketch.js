let gap;
let drawn;
let ann;
let temp;
let pts;
let shapes;
let tools;
let options;
let prop;
let sel;

function setup() {
  sel = null;
  ann = null;
  pts = 0;
  drawn = [];
  shapes = {
    "Pencil":[],
    "Ellipse":[],
    "Circle":[],
    "Line":[],
    "Point":[],
    "Quad":[],
    "Rect":[],
    "Square":[],
    "Triangle":[]
  };
  options = {};
  tools={
    "Pencil":[1],
    //"Arc":4,
    "Ellipse":['vertical extent','horizontal extent','center'],
    "Circle":['radius','center'],
    "Line":['point','point'],
    "Point":['point'],
    "Quad":['point','point','point','point'],
    "Rect":['opposite corner','corner'],
    "Square":['opposite corner','corner'],
    "Triangle":['point','point','point'],
  };
  prop = {
    width : 600 - 2,
    toolBarH : 30,
    toolBarY : 0,
    statusBarH : 30,
    canvasH : 600,
    optionsBarH : 40,
  };
  prop.optionsBarY = prop.toolBarY + prop.toolBarH;
  prop.canvasY = prop.optionsBarH + prop.optionsBarY;
  prop.statusBarY = prop.canvasY + prop.canvasH;

  createCanvas(prop.width + 2, prop.toolBarH + prop.statusBarH + prop.canvasH + prop.optionsBarH);
  textAlign(CENTER, CENTER);
  textSize(15);
  //strokeWeight(1);
  //stroke(0);
  noStroke();
}

function draw() {
  background(255);
  showToolBar();
  //rect(1, prop.statusBarY + 1, width - 2, prop.statusBarH - 2);
  strokeWeight(1);
  stroke(0);
  noFill();
  rect(1, prop.canvasY, prop.width, prop.canvasH);//canvas
  for(let i=0;i<drawn.length;i++){
    ellipse(drawn[i].x, drawn[i].y, 10);
    point(drawn[i]);
  }
  
  if(temp && sel)
    ellipse(temp.x, temp.y, 10);
  for(let s in shapes){
    for(let ob in s){
      //window['circle'](300,400,50);
    }
  }

  showStatusBar();

  showOptionsBar();

  showAnnotation();
}

function showToolBar(){
  gap = width/Object.keys(tools).length;
  push();
  strokeWeight(1);
  stroke(0);
  for(let i=0; i<Object.keys(tools).length; i++){
    fill(255);
    if(sel==Object.keys(tools)[i])
      fill(220);
    rect(i * gap + 1, prop.toolBarY, gap - 1, prop.toolBarH);
    fill(0);
    text(Object.keys(tools)[i], (i+0.5)*gap, prop.toolBarH/2);
  }
  pop();
}

function showOptionsBar(){
  push();
  strokeWeight(1);
  stroke(0);
  const gap = Object.keys(options).length;
  rect(1, prop.optionsBarY, prop.width, prop.optionsBarH);
  pop();
}

function showStatusBar(){//status bar
  push();
  strokeWeight(1);
  stroke(0);
  fill(220);
  rect(1, prop.statusBarY, prop.width, prop.statusBarH);
  fill(0)
  if(sel)
    text(sel+" has "+pts+" point"+((pts>1)?'s ':' ')+'left', width/2, prop.statusBarY + prop.statusBarH/2);
  pop();
}

function showAnnotation(){
  if(sel && mouseX > 0 && mouseX < width && mouseY > prop.canvasY+1 && mouseY < prop.canvasY+prop.canvasH-1){
    push();
    fill(0);
    const w = ann.length * 9;
    rect(mouseX +10, mouseY - 20, w, 20);
    fill(255);
    text(ann, mouseX + 10 +w/2, mouseY - 10);
    pop();
  }
}

function mousePressed(){
  if(mouseY > prop.toolBarY && mouseY < prop.toolBarY + prop.toolBarH){
    if(!sel){
      sel=Object.keys(tools)[floor(mouseX/gap)];
      pts=tools[sel].length;
      ann=(tools[sel])[pts-1];
    } else {
      sel = null;
      pts = 0;
      ann = null;
    }
  } else if(mouseY > prop.canvasY && mouseY < prop.canvasY+prop.canvasH && sel){
    temp = createVector(mouseX, mouseY);
  }
}

function mouseReleased(){
  if(mouseX > 0 && mouseX < width && mouseY > prop.canvasY && mouseY < prop.canvasY+prop.canvasH && sel){
    drawn.push(createVector(mouseX,mouseY));
    --pts;
    ann=(tools[sel])[pts-1];
    if(!pts)
      sel=null;
    temp=null;
  }
}

function mouseDragged(){
  if(mouseX > 0 && mouseX < width && mouseY > prop.canvasY && mouseY < prop.canvasY+prop.canvasH && sel){
    temp = createVector(mouseX, mouseY);
  }
}

function keyPressed(){
  //Delete Key deletes last point drawn
  if(keyCode == 46){
    drawn.pop();
    ++pts;
    ann=(tools[sel])[pts-1];
  }
}
