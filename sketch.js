let ann;  //Annotation Text
let pts;  //Show Points left for an object
let shapes; //stores all the created shapes
let tools;  //shape creating tools
let options;  //various canvas options
let prop;   //stores canvas properties
let sel;    //tool selected
let temp;   //temporarily stores clicked point's coordinates which is used to calculate the parameters
let lastpt; //stores the last clicked point of the object
let params;   //stores realtime parameters of the object thats currently being made
let mag;  //store magnitude of temp with other object points as parameter if required
let drawn;  //stores  realtime coordinates of the object thats currently being made not parameters
/*
  parameters here are the shapes's function parameters required to create the shape
  and coordinates are user-placed points on the canvas in order to create shape/object
*/

function setup() {
  sel = ann = null;
  pts = 0;
  params = temp = mag = lastpt = drawn = [];

  //stores all the user created shapes
  shapes = {};

  //stores various options with parameters
  options = {
    "Show Grid" : {enabled : false, func : 'showGrid'},
    "Show Ruler" : {enabled : false, func : 'showRuler'},
    "Export As" : {enabled : false, param : '|'},//prestores blinking line
  };

  //stores all the point coordinate description to help user
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

  //stores canvas properties
  prop = {
    width : windowWidth - 2,
    toolBarH : 40,
    toolBarY : 0,
    statusBarH : 30,
    optionsBarH : 40,
  };
  prop.canvasH = windowHeight - prop.toolBarH - prop.statusBarH - prop.optionsBarH;
  prop.optionsBarY = prop.toolBarY + prop.toolBarH;
  prop.canvasY = prop.optionsBarH + prop.optionsBarY;
  prop.statusBarY = prop.canvasY + prop.canvasH;
  prop.toolGap = width / Object.keys(tools).length;
  prop.optionsGap = width / Object.keys(options).length;

  //global setting
  createCanvas(prop.width + 2, prop.toolBarH + prop.statusBarH + prop.canvasH + prop.optionsBarH);
  textAlign(CENTER, CENTER);
  textSize(15);
  noStroke();
}

function draw() {

  background(255);

  strokeWeight(1);
  stroke(0);

  noFill();
  //Canvas
  rect(1, prop.canvasY, prop.width +1, prop.canvasH);

  //Calls Option specific functions when enabled stored as object name `func`
  for(let opt in options){
    if(options[opt].enabled && typeof(window[options[opt].func]) != 'undefined')
      window[options[opt].func].apply(this);
  }

  //displays user drawn points on the canvas in order to create objects/shapes
  for(let i=0;i<drawn.length;i+=2){
    ellipse(drawn[i], drawn[i+1], 10);
    point(drawn[i], drawn[i+1]);
  }

  //displays a circle highlighting mouse pointer on canvas
  if(sel && !options["Export As"].enabled)
    ellipse(mouseX, mouseY, 10);

  //Shows Shapes and Vertices
  push();
  rectMode(CORNERS);
  strokeWeight(2);

  //Shows Preview of (to be created) object
  if(lastpt.length)
    window[sel.toLowerCase()].apply(this, params.concat(lastpt));

  //displays all the already-created shapes
  for(let s in shapes){
    for(let ob of shapes[s])
      window[s.toLowerCase()].apply(this, ob);
  }
  pop();

  //Shows Tools/Options/Status Bar
  showStatusBar();
  showToolBar();
  showOptionsBar();

  //Shows Annotations
  showAnnotation();

  //Shows Export Dialog Box if Enabled
  if(options["Export As"].enabled)
    exportFile(options["Export As"].param); //displays dialog box
  else
    options["Export As"].param = '|'; //resets filename
}

//This Function shows Grid on Canvas which gets called 
function showGrid(){
  push();
  noFill();
  strokeWeight(1);
  let lim = (prop.canvasH > prop.width)?prop.canvasH : prop.width;
  for(let i = 10, inc = i; i < lim; i += inc){
    stroke(0,100);
    strokeWeight(0.75);
    if(i % 50 === 0)
      stroke(0,200);  //thickens every 5th line
    if(i < prop.canvasH)
      line(1, i + prop.canvasY, prop.width, i + prop.canvasY);
    if(i < prop.width)
      line(i, prop.canvasY, i, prop.canvasH + prop.canvasY);
  }
  pop();
}

//Shows Ruler
function showRuler(){
  push();
  const tSize = 10;
  textSize(tSize);
  textAlign(CENTER, CENTER);
  const bound = 20;
  const thick = bound - 2;
  let bX = 0;
  let bY = prop.canvasY;
  //when mouse hovers over vertical ruler then displace it
  if(mouseX <= bound && mouseY >= prop.canvasY && mouseY <= prop.canvasH + prop.canvasY)
    bX = prop.width - thick;
  //when mouse hovers over horizontal ruler then displace it
  if(mouseY >= prop.canvasY && mouseY <= prop.canvasY + bound)
    bY = prop.canvasY + prop.canvasH - thick;
  fill(220);
  rect(bX + 1, prop.canvasY+1, thick, prop.canvasH - 1);
  rect(1, bY + 1, prop.width, thick);
  fill(0);
  noStroke();
  const off = 2;//text displacement offset
  for(let i=50;i<prop.width;i+=50){
    text(int(i/10), i-off, bY+thick/2);
    text(int(i/10), bX+thick/2, i-off+prop.canvasY+1);
  }
  stroke(0);
  fill(255);
  rect(bX+1, bY+1, thick, thick);
  //shows two mini-red position lines on the ruler indicating mouse position
  if(mouseX >= 0 && mouseX <= prop.width+2 && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH){
    stroke(255,0,0);//red color
    line(mouseX, bY, mouseX, bY + bound);
    line(bX, mouseY, bX + bound, mouseY);
  }
  pop();
}

/*
  This function displays Export File Dialog box.
  parameter `name` represents the filename typed in the input box.
*/
function exportFile(name){
  push();
  rectMode(CENTER);
  textAlign(LEFT, BASELINE);
  textSize(22);
  stroke(0,100);
  strokeWeight(10);
  rect(width/2+8, height/2+8, 370, 170);//box shadow
  stroke(255, 0, 0);
  strokeWeight(2);
  fill(255);
  rect(width/2, height/2, 375, 175);//Rectangle Dialog Box
  stroke(0);
  strokeWeight(0.5);
  fill(235);
  rect(width/2 - 20, height/2, 260, 35);//Text input box
  fill(0);
  text("Enter Filename :", width/2 - 150, height/2 - 35);
  text(".txt", width/2 + 120, height/2 + 7);

  //cursor blink effect
  //blinks for 10s after every 10s of not blinking
  if(frameCount % 20 > 10)
    name = name.slice(0,-1);//removes cursor which is the last letter in `name`

  text(name, width/2 - 145, height/2 + 6);//displays user inputted filename

  fill(119, 204, 92);//Green
  rect(width/2 + 100, height/2 + 50, 100, 35, 5);//Save Button
  fill(255);
  stroke(255);
  text("SAVE", width/2 + 70, height/2 + 57);
  pop();
}

/*
  This function creates function parameters for p5 shapes drawn.

  boolean bool parameter represents whether the user has
  released the mouse (click) and registered the coordinate
  to be appended to params[] or not.

  bool=true will add the parameter(either temp or mag) to params[].
  bool=false will not.
*/
function makeParam(bool){
  temp = [mouseX, mouseY]; //stores the mouse pointer clicked/released coordinate
  mag = [];
  //checks and sets magnitude parameter for particular point of the shape
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
  //once mag[] is set then it get appended to parameter list (i.e params[]) instead of temp[]
  //temp[] gets appended to drawn[] for user-drawn points to be displayed
  if(bool && pts > 1){
    params = params.concat((mag.length)?mag:temp);
    drawn = drawn.concat(temp);
  }
  //if last point is left to be drawn before object formation then lastpt[] gets set instead of params[] and drawn[]
  //this lastpt[] initialization gets to enable the 'Object Preview'
  else
    lastpt = (mag.length)?mag:temp;
}

//shows shapes toolbar
function showToolBar(){
  push();
  strokeWeight(1);
  stroke(0);
  for(let i=0; i<Object.keys(tools).length; i++){
    fill(255);
    if(sel==Object.keys(tools)[i])
      fill(220);  //if selected then highlight it
    rect(i * prop.toolGap + 1, prop.toolBarY, prop.toolGap - 1, prop.toolBarH);
    fill(0);
    text(Object.keys(tools)[i], (i+0.5) * prop.toolGap, prop.toolBarY + prop.toolBarH / 2);
  }
  pop();
}

//shows options bar
function showOptionsBar(){
  push();
  strokeWeight(1);
  stroke(0);
  for(let i = 0; i < Object.keys(options).length; i++){
    fill(255);
    if(options[Object.keys(options)[i]].enabled)
      fill(220);  //if selected then highlight it
    rect(i * prop.optionsGap + 1, prop.optionsBarY, prop.optionsGap - 1, prop.optionsBarH);
    fill(0);
    text(Object.keys(options)[i], (i+0.5) * prop.optionsGap, prop.optionsBarY + prop.optionsBarH / 2);
  }
  pop();
}

//shows status of the current object being created in status bar
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

//shows annotations when a shape tool is selected
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
  //shape tool selection from toolbar
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
  }
  //option selection from optionsbar and toggling its enability
  else if(mouseY >= prop.optionsBarY && mouseY <= prop.optionsBarY+prop.optionsBarH){
    let opt = Object.keys(options)[floor(mouseX/prop.optionsGap)];
    options[opt].enabled = !options[opt].enabled;
  }
  //when save button from export dialog box is clicked
  else if(mouseX>=width/2+50 && mouseX<=width/2+150 && mouseY>=height/2+32.5 && mouseY<=height/2+67.5 && options["Export As"].enabled && options["Export As"].param.length-1){
    let content = ["//Generated by Canvas2D at https://ahmedazhar05.github.io/Canvas2D\n","rectMode(CORNERS);","ellipseMode(CENTER);\n"];
    for(let s in shapes){
      for(let ob of shapes[s])
        content.push(s.toLowerCase()+"("+ob.reduce((sum,x) => sum +", "+ x.toString())+");");
    }
    save(content, options["Export As"].param.slice(0,-1)+'.txt');
    options["Export As"].enabled = false;
  }
  //point addition when shape tool is selected and clicked on canvas
  else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && pts == 1){
    makeParam(false);
  }
}

function mouseReleased(){
  //addtion of points in drawn[]
  //addition of params[] to shapes when object's final point is created
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
  //preview shape when last point of the object is being drawn/dragged
  if(mouseX >= 0 && mouseX <= width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && pts == 1){
    makeParam(false);
  }
}

function keyPressed(){
  //Export Filename Input
  if(options["Export As"].enabled && options["Export As"].param.length < 12 && (keyCode>=65 && keyCode<=90 || keyCode>=48 && keyCode<=57 || keyCode>=96 && keyCode<=105 || key=='-' || key=='_'))
    options["Export As"].param = options["Export As"].param.slice(0,-1)+key+'|';
  else if(options["Export As"].enabled && keyCode == 8 && options["Export As"].param.length > 1)
    options["Export As"].param = options["Export As"].param.slice(0,-2)+'|';
  //File Save
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
