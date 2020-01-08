let ann;
let pts;
let shapes;
let tools;
let options;
let prop;
let sel;
let temp;
let lastpt;
let params;
let mag;

function setup() {
  sel = null;
  ann = null;
  pts = 0;
  shapes = {};
  params = [];
  temp = [];
  mag = [];
  lastpt=[];
  dPts = [];
  drawn=[];
  options = {
    "Show Grid" : {enabled : false, func : 'showGrid'},
    "Show Ruler" : {enabled : false, func : 'showRuler'},
    "Export As" : {enabled : false, param : '|'},
  };
  tools={
    // "Arc":['bend', 'end point', 'start point'],
    "Ellipse":['vertical extent', 'horizontal extent','center'],
    "Circle":['radius','center'],
    "Line":['point','point'],
    "Point":['point'],
    "Quad":['point','point','point','point'],
    "Rect":['opposite corner','corner'],
    //"Square":['opposite corner','corner'],
    "Triangle":['point','point','point'],
  };
  prop = {
    width : windowWidth - 2,
    toolBarH : 40,
    toolBarY : 0,
    statusBarH : 30,
    optionsBarH : 40,
  };
  //prop.canvasH = prop.width + 2;
  prop.canvasH = windowHeight - prop.toolBarH - prop.statusBarH - prop.optionsBarH;
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
    if(options[opt].enabled && typeof(window[options[opt].func]) != 'undefined')
      window[options[opt].func].apply(this);
  }

  for(let i=0;i<drawn.length;i+=2){
    ellipse(drawn[i], drawn[i+1], 10);
    point(drawn[i], drawn[i+1]);
  }

  if(sel && !options["Export As"].enabled)
    ellipse(mouseX, mouseY, 10);

  //Show Shapes and Vertices
  push();
  rectMode(CORNERS);
  strokeWeight(2);
  //Preview
  if(lastpt.length)
    window[sel.toLowerCase()].apply(this, params.concat(lastpt));

  for(let s in shapes){
    for(let ob of shapes[s])
      window[s.toLowerCase()].apply(this, ob);
  }
  pop();

  //Show Various Bar
  showStatusBar();
  showToolBar();
  showOptionsBar();
  showAnnotation();
  if(options["Export As"].enabled)
    exportFile(options["Export As"].param);
  else
    options["Export As"].param = '|';
}

function showGrid(){
  push();
  noFill();
  strokeWeight(1);
  let lim = (prop.canvasH > prop.width)?prop.canvasH : prop.width;
  for(let i = 10, inc = i; i < lim; i += inc){
    stroke(0,100);
    strokeWeight(0.75);
    if(i % 50 === 0)
      stroke(0,200);
    if(i < prop.canvasH)
      line(1, i + prop.canvasY, prop.width, i + prop.canvasY);
    if(i < prop.width)
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

function exportFile(name){
  push();
  rectMode(CENTER);
  textAlign(LEFT, BASELINE);
  textSize(22);
  stroke(0,100);
  strokeWeight(10);
  rect(width/2+8, height/2+8, 370, 170);//shadow
  stroke(255, 0, 0);
  strokeWeight(2);
  fill(255);
  rect(width/2, height/2, 375, 175);//Dialog
  stroke(0);
  strokeWeight(0.5);
  fill(235);
  rect(width/2 - 20, height/2, 260, 35);//Textbox
  fill(0);
  text("Enter Filename :", width/2 - 150, height/2 - 35);
  text(".txt", width/2 + 120, height/2 + 7);
  let p=frameCount%20;
  if(p>10)
    name = name.slice(0,-1);
  text(name, width/2 - 145, height/2 + 6);
  fill(119, 204, 92);//Green
  rect(width/2 + 100, height/2 + 50, 100, 35, 5);//Save Button
  fill(255);
  stroke(255);
  text("SAVE", width/2 + 70, height/2 + 57);
  pop();
}

function makeParam(bool){
  temp = [mouseX, mouseY];
  mag = [];
  switch(sel){
    case 'Circle':
      if(pts == 1)
        mag.push(dist(params[0], params[1], temp[0], temp[1]) * 2);
      break;
    case 'Ellipse':
      if (pts == 2){
        mag.push((temp[0] - params[0])*2);
        temp[1] = params[1];
      }
      else if (pts == 1){
        mag.push((temp[1] - params[1])*2);
        temp[0] = params[0];
      }
      break;
    // case 'Arc':
    //   break;
  }
  if(bool && pts > 1){
    params = params.concat((mag.length)?mag:temp);
    drawn = drawn.concat(temp);
  }
  else
    lastpt = (mag.length)?mag:temp;
  /*if(sel == 'Circle' && pts == 1){
    mag.push(dist(params[0], params[1], temp[0], temp[1]) * 2);
  } else if(sel == 'Ellipse'){
    if(pts == 2)
      mag.push((temp[0] - params[0])*2);
    else if(pts == 1)
      mag.push((temp[1] - params[1])*2);
  } else
    currPts = currPts.concat(temp);*/
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
  textAlign(LEFT, CENTER);
  stroke(0);
  fill(220);
  rect(1, prop.statusBarY, prop.width, prop.statusBarH);
  fill(0)
  if(sel)
    text(sel+" has "+pts+" point"+((pts>1)?'s ':' ')+'left', 10, prop.statusBarY + prop.statusBarH/2);
  pop();
}

function showAnnotation(){
  if(sel && mouseX > 0 && mouseX < width && mouseY > prop.canvasY+1 && mouseY < prop.canvasY+prop.canvasH-1 && !options["Export As"].enabled){
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
      sel = ann = null;
      pts = 0;
      params = drawn = [];
    } else {
      sel=Object.keys(tools)[ind];
      pts=tools[sel].length;
      ann=(tools[sel])[pts-1];
      params = drawn = [];
    }
  } else if(mouseY >= prop.optionsBarY && mouseY <= prop.optionsBarY+prop.optionsBarH){
    let opt = Object.keys(options)[floor(mouseX/prop.optionsGap)];
    options[opt].enabled = !options[opt].enabled;
  } else if(mouseX>=width/2+50 && mouseX<=width/2+150 && mouseY>=height/2+32.5 && mouseY<=height/2+67.5 && options["Export As"].enabled && options["Export As"].param.length-1){
    let content = ["//Generated by Canvas2D at https://ahmedazhar05.github.io/Canvas2D\n","rectMode(CORNERS);","ellipseMode(CENTER);\n"];
    for(let s in shapes){
      for(let ob of shapes[s])
        content.push(s.toLowerCase()+"("+ob.reduce((sum,x) => sum +", "+ x.toString())+");");
    }
    save(content, options["Export As"].param.slice(0,-1)+'.txt');
    options["Export As"].enabled = false;
  } else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && pts == 1){
    makeParam(false);
  }
}

function mouseReleased(){
  if(mouseX >= 0 && mouseX <= prop.width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel){
    makeParam(true);
    --pts;
    ann = (tools[sel])[pts-1];
    if(!pts){
      if(typeof(shapes[sel]) == 'undefined')
        shapes[sel] = [];
      shapes[sel].push(params.concat(lastpt));
      params = lastpt = drawn = [];
      sel = ann = null;
    }
    mag = temp = [];
  }
}

function mouseDragged(){
  if(mouseX >= 0 && mouseX <= width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && pts == 1){
    makeParam(false);
  }
}

function keyPressed(){
  if(options["Export As"].enabled && options["Export As"].param.length < 12 && (keyCode>=65 && keyCode<=90 || keyCode>=48 && keyCode<=57 || keyCode>=96 && keyCode<=105 || key=='-' || key=='_'))
    options["Export As"].param = options["Export As"].param.slice(0,-1)+key+'|';
  else if(options["Export As"].enabled && keyCode == 8 && options["Export As"].param.length > 1)
    options["Export As"].param = options["Export As"].param.slice(0,-2)+'|';
  else if(options["Export As"].enabled && options["Export As"].param.length-1 && keyCode == 13){
    let content = ["//Generated by Canvas2D at https://ahmedazhar05.github.io/Canvas2D\n","rectMode(CORNERS);","ellipseMode(CENTER);\n"];
    for(let s in shapes){
      for(let ob of shapes[s])
        content.push(s.toLowerCase()+"("+ob.reduce((sum,x) => sum +", "+ x.toString())+");");
    }
    save(content, options["Export As"].param.slice(0,-1)+'.txt');
    options["Export As"].enabled = false;
  }
}
