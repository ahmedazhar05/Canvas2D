let ann;
let pts;
let shapes;
let tools;
let options;
let prop;
let sel;
let temp;
let drawn;
let mag;

function setup() {
  sel = null;
  ann = null;
  pts = 0;
  shapes = {};
  drawn = [];
  temp = [];
  mag = 0;
  options = {
    "Show Grid" : {enabled : false, func : 'showGrid'},
    "Show Ruler" : {enabled : false, func : 'showRuler'},
  };
  tools={
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
    toolBarH : 40,
    toolBarY : 0,
    statusBarH : 30,
    optionsBarH : 40,
  };
  prop.canvasH = prop.width + 2;
  prop.optionsBarY = prop.toolBarY + prop.toolBarH;
  prop.canvasY = prop.optionsBarH + prop.optionsBarY;
  prop.statusBarY = prop.canvasY + prop.canvasH;

  createCanvas(prop.width + 2, prop.toolBarH + prop.statusBarH + prop.canvasH + prop.optionsBarH);
  textAlign(CENTER, CENTER);
  textSize(15);
  noStroke();

  prop.toolGap = width / Object.keys(tools).length;
  prop.optionsGap = width / Object.keys(options).length;
}

function draw() {
  background(255);

  strokeWeight(1);
  stroke(0);

  noFill();
  rect(1, prop.canvasY, prop.width +1, prop.canvasH);//canvas

  for(let opt in options){
    if(options[opt].enabled)
      window[options[opt].func].apply(this);
  }

  for(let i=0;i<drawn.length;i+=2){
    ellipse(drawn[i], drawn[i+1], 10);
    point(drawn[i], drawn[i+1]);
  }

  if(sel)
    ellipse(mouseX, mouseY, 10);

  /*for(let s in shapes){
    for(let ob of shapes[s]){
      push();
      rectMode(CORNERS);
      ellipseMode(CORNERS);
      window[s.toLowerCase()].apply(this, ob);
      pop();
    }
  }*/

  showStatusBar();
  
  showToolBar();

  showOptionsBar();

  showAnnotation();
}

function showGrid(){
  push();
  noFill();
  strokeWeight(1);
  for(let i = 10, inc = i; i < prop.canvasH; i += inc){
    stroke(0,100);
    if(i % 50 === 0)
      stroke(0,200);
    line(1, i + prop.canvasY, prop.width, i + prop.canvasY);
    line(i, prop.canvasY, i, prop.canvasH + prop.canvasY);
  }
  pop();
}

function showRuler(){
  push();
  let tSize = 10;
  textSize(tSize);
  textAlign(CENTER, CENTER);
  let bound = 20;
  let thick = bound - 2;
  let bX = 0;
  let bY = prop.canvasY;
  if(mouseX <= bound && mouseY >= prop.canvasY && mouseY <= prop.canvasH + prop.canvasY)
    bX = prop.width - thick;
  if(mouseY >= prop.canvasY && mouseY <= prop.canvasY + bound)
    bY = prop.canvasY + prop.canvasH - thick;
  fill(220)
  rect(bX + 1, prop.canvasY+1, thick, prop.canvasH - 1);
  rect(1, bY + 1, prop.width, thick);
  fill(0);
  noStroke();
  let off = 2;
  for(let i=50;i<prop.width;i+=50){
    text(int(i/10), i-off, bY+thick/2);
    text(int(i/10), bX+thick/2, i-off+prop.canvasY+1);
  }
  stroke(0);
  fill(255);
  rect(bX+1, bY+1, thick, thick);
  if(mouseX >= 0 && mouseX <= prop.width+2 && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH){
    stroke(255,0,0);
    line(mouseX, bY, mouseX, bY + bound);
    line(bX, mouseY, bX + bound, mouseY);
  }
  pop();
}

function showToolBar(){
  push();
  strokeWeight(1);
  stroke(0);
  for(let i=0; i<Object.keys(tools).length; i++){
    fill(255);
    if(sel==Object.keys(tools)[i])
      fill(220);
    rect(i * prop.toolGap + 1, prop.toolBarY, prop.toolGap - 1, prop.toolBarH);
    fill(0);
    text(Object.keys(tools)[i], (i+0.5) * prop.toolGap, prop.toolBarY + prop.toolBarH / 2);
  }
  pop();
}

function showOptionsBar(){
  push();
  strokeWeight(1);
  stroke(0);
  for(let i = 0; i < Object.keys(options).length; i++){
    fill(255);
    if(options[Object.keys(options)[i]].enabled)
      fill(220);
    rect(i * prop.optionsGap + 1, prop.optionsBarY, prop.optionsGap - 1, prop.optionsBarH);
    fill(0);
    text(Object.keys(options)[i], (i+0.5) * prop.optionsGap, prop.optionsBarY + prop.optionsBarH / 2);
  }
  pop();
}

function showStatusBar(){
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
    let mX = mouseX;
    if(mX + 10 + w > width)
      mX = mX - w - 20;
    rect(mX +10, mouseY - 20, w, 20);
    fill(255);
    text(ann, mX + 10 +w/2, mouseY - 10);
    pop();
  }
}

function mousePressed(){
  if(mouseY >= prop.toolBarY && mouseY <= prop.toolBarY + prop.toolBarH){
    let ind = floor(mouseX/prop.toolGap);
    if(sel == Object.keys(tools)[ind]){
      sel = null;
      pts = 0;
      ann = null;
      drawn = [];
    } else {
      sel=Object.keys(tools)[ind];
      pts=tools[sel].length;
      ann=(tools[sel])[pts-1];
    }
  } else if(mouseY >= prop.optionsBarY && mouseY <= prop.optionsBarY+prop.optionsBarH){
    let opt = Object.keys(options)[floor(mouseX/prop.optionsGap)];
    options[opt].enabled = !options[opt].enabled;
  } else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel){
    makeParam(true);
  }
}

function mouseReleased(){
  if(mouseX >= 0 && mouseX <= prop.width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel){
    makeParam(false);
    --pts;
    ann=(tools[sel])[pts-1];
    mag = 0;
    if(!pts){
      if(typeof(shapes[sel]) == 'undefined')
        shapes[sel] = [];
      shapes[sel].push(drawn);
      drawn = [];
      sel=null;
      ann=null;
    }
    temp=null;
  }
}

function mouseDragged(){
  if(mouseX >= 0 && mouseX <= width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel){
    makeParam(true);
  }
}

function makeParam(bool){
  temp = [mouseX, mouseY];
  mag = 0;
  if(sel == 'Circle' && pts == 1){
    mag = dist(drawn[drawn.length-2], drawn[drawn.length-1], temp[0], temp[1]) * 2;
  }
  
}

/*function preview(){
  if(mag){
    drawn.pop();
    drawn.push(mag);
  }
  else{
    drawn.pop();
    drawn.pop();
    drawn.concat(temp);
  }
  console.log(drawn);
}*/