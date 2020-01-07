let gap;
let heights={
  tb:40,
  fb:30,
};
let drawn=[];
let ann;
let temp;
let pts=0;
let sh={"Pencil":[],"Ellipse":[],"Circle":[],"Line":[],"Point":[],"Quad":[],"Rect":[],"Square":[],"Triangle":[]};

let cache={};

let shapes={
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

let sel=null;
function setup() {
  createCanvas(600, 600);
  strokeWeight(1);
  textAlign(CENTER, CENTER);
  textSize(15);
  stroke(0);
}

function draw() {
  background(255);
  gap = width/Object.keys(shapes).length;
  for(let i=0;i<Object.keys(shapes).length;i++){
    fill(255);
    if(sel==Object.keys(shapes)[i])
      fill(220);
    rect(i * gap + 1, 0, gap -2, heights.tb);
    fill(0);
    text(Object.keys(shapes)[i], (i+0.5)*gap, heights.tb/2);
  }
  fill(255);
  rect(1, heights.tb + 1, width-2, heights.fb - 2);
  rect(1, heights.tb+heights.fb +1, width-2, height - heights.tb-heights.fb - 2);//canvas
  fill(0)
  if(sel)
    text(sel+" has "+pts+" point"+((pts>1)?'s ':' ')+'left', width/2, heights.tb + heights.fb/2);
  fill(255);
  for(let i=0;i<drawn.length;i++){
    ellipse(drawn[i].x, drawn[i].y, 10);
    point(drawn[i]);
  }
  
  if(temp && sel)
    ellipse(temp.x, temp.y, 10);
  for(let v in sh){
    //window[];
  }
  if(sel && mouseX > 0 && mouseX < width && mouseY > heights.fb+heights.tb+1 && mouseY < height-1){
    fill(0);
    const w = ann.length * 9;
    rect(mouseX +10, mouseY - 20, w, 20);
    fill(255);
    text(ann, mouseX + 10 +w/2, mouseY - 10);
  }
}

function mousePressed(){
  if(mouseY > 0 && mouseY < heights.tb){
    sel=Object.keys(shapes)[floor(mouseX/gap)];
    pts=shapes[sel].length;
    ann=(shapes[sel])[pts-1];
  } else if(mouseY > heights.fb+heights.tb+1 && mouseY < height-1 && sel){
    temp = createVector(mouseX, mouseY);
  }
}
function mouseReleased(){
  if(mouseX > 0 && mouseX < width && mouseY > heights.fb+heights.tb+1 && mouseY < height-1 && sel){
    drawn.push(createVector(mouseX,mouseY));
    --pts;
    ann=(shapes[sel])[pts-1];
    if(!pts){
      cache[sel]=sel;
      sel=null;
    }
    temp=null;
  }
}
function mouseDragged(){
  if(mouseX > 0 && mouseX < width && mouseY > heights.fb+heights.tb+1 && mouseY < height-1 && sel){
    temp = createVector(mouseX, mouseY);
  }
}

function keyPressed(){
  if(keyCode[0] == 17 && keyCode[1] == 90){
    drawn.pop();
    ++pts;
    ann=(shapes[sel])[pts-1];
    if(!sel)
      sel = cache[sel];
  }
}
