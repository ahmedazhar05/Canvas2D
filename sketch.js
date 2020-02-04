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
let saved;  //shapes exported/saved so far
let drawable; //determines if user can draw on canvas or not
let desc; //stores description of tools
let pos;  //stores regex values
let drag; //to store dialog box's drag offsets w.r.t. mouseX and mouseY

function preload(){
  font = loadFont('Helvetica.ttf');
  code = loadFont('RobotoMono-Bold.ttf');
}

/*
  parameters here are the shapes's function parameters required to create the shape
  and coordinates are user-placed points on the canvas in order to create shape/object
*/

function setup() {
  cursor(ARROW);
  drawable = true;
  sel="Pencil";
  pts=-1;
  ann="raw";
  // sel = ann = null;
  // pts = 0;
  params = temp = mag = lastpt = drawn = [];

  drag = {};

  saved=0;

  //stores all the user created shapes
  shapes = [];

  //stores various options with parameters
  options = {
    "Non Stop" : {enabled : true, func : 'voidfunc'},
    "Show Grid" : {enabled : false, func : 'showGrid'},
    "Show Ruler" : {enabled : false, func : 'showRuler'},
    "Show Annotation" : {enabled : true, func : 'showAnnotation'},
    "Help" : {enabled : false, func : 'showHelp', param : [1]},
    "Export As" : {enabled : false, func : 'exportFile', param : ['|']},//prestores blinking line
  };

  //stores all the point coordinate description to help user
  tools={
    "Pencil":['raw'],
    "Bezier":['last pull point','first pull point','end point','start point'],
    "Ellipse":['shape','center'],
    "Circle":['radius','center'],
    "Line":['point','point'],
    "Point":['point'],
    "Quad":['point','point','point','point'],
    "Rect":['opposite corner','corner'],
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
  createCanvas(prop.width + 2, prop.toolBarH + prop.statusBarH + prop.canvasH + prop.optionsBarH);
  prop.optionsBarY = prop.toolBarY + prop.toolBarH;
  prop.canvasY = prop.optionsBarH + prop.optionsBarY;
  prop.statusBarY = prop.canvasY + prop.canvasH;
  prop.toolGap = width / Object.keys(tools).length;
  prop.optionsGap = width / Object.keys(options).length;
  prop.help = {
    x : width/2,
    y : height/2,
  };
  prop.export = {
    x : width/2,
    y : height/2,
  };

  //global setting
  textAlign(CENTER, CENTER);
  textSize(15);
  noStroke();

  desc = '';
  pos = {};
  fetch('./Desc.txt')
  .then(response => response.text())
  .then(data => {

    const wid=500;
    const margin=20;
    const innerMargin=20;

    data = data.trim()+'\n';
    let breaks=[];
    [...data.matchAll(/[\s\n]/gm)].forEach(val => breaks.push(val.index));
    let start=0;
    let f=font;
    for(let stop of breaks){
      let sub = data.substring(start, stop+1);
      if(data[stop] == '\n'){
        desc += sub;
        start = stop + 1;
      } else if(f.textBounds(sub, 0, 0, 18).w > wid-(margin+innerMargin+((f==font)?0:10))*2){
        desc += sub.substring(0, sub.lastIndexOf(' ', sub.length - 2))+'\n';
        sub = "";
        start = data.lastIndexOf(' ', stop-1)+1;
      }
    }

    let regex = [
      [...desc.matchAll(/(?:\*\*)([^\s][\w,.><"':;}{()\-+/\s&^%$#@!~`]*[^\s])(?:\*\*)/gm)],//bolded string
      [...desc.matchAll(/[^*\n]\*([\w\s.,]+)\*(?!\*)/gm)],//italisized string
      [...desc.matchAll(/^(?:[\t\s]*)(\d\d?)\.(?!\n\s).+/gm)],//numbered lists
      [...desc.matchAll(/^([\t\s]*)\-(?=\s.+)/gm)],//bulleted lists
      [...desc.matchAll(/^(?:#{1,6}\s)(.+)(?:\n*)|^(.+)(?:\n[-=]\s*\n)/gm)],//heading
      [...desc.matchAll(/^`{3}/gm)],//code segment start/end
      [...desc.matchAll(/\(([^\)]*[,\w]*)\)/gm)],//function parameters
      [...desc.matchAll(/[a-zA-z0-9]+(?=\.[a-zA-Z0-9])/gm)],//object variable
      [...desc.matchAll(/\w+(?=\()/gm)],//function name
      [...desc.matchAll(/\n/gm)],//newline '\n'
    ];

    for(let i=0;i<regex.length|0;i++){
      for(let j=0;j<regex[i].length|0;j++){
        if(typeof(pos[regex[i][j].index]) == 'undefined')
          pos[regex[i][j].index]={i, r: regex[i][j]};
      }
    }
  });
  //designing 'desc' data for help dialog box content using pos's indexes
}

function draw() {

  if(options["Export As"].enabled && mouseX > prop.export.x - 20 - 260/2 && mouseX < prop.export.x - 20 + 260/2 && mouseY > prop.export.y - 35/2 && mouseY < prop.export.y + 35/2)
    cursor(TEXT);
  else if(options["Export As"].enabled && mouseX > prop.export.x + 100 - 50 && mouseX < prop.export.x + 100 + 50 && mouseY > prop.export.y + 50 - 35/2 && mouseY < prop.export.y + 50 + 35/2)
    cursor(HAND);
  else if (typeof drag.pr != 'undefined')
    cursor(MOVE);
  else
    cursor(ARROW);

  background(255);

  noFill().strokeWeight(1).stroke(0);

  //Canvas
  rect(1, prop.canvasY, prop.width +1, prop.canvasH);

  let op = 0;
  //Calls Option-specific-functions stored as object name `func` and parameters stored as `param`
  for(let opt in options){
    if(options[opt].enabled)
      window[options[opt].func].apply(this, options[opt].param);
    if (++op == 2)//number of options on optionsbar from left that will be displayed under the canvas
      break;
  }

  //displays user drawn points on the canvas in order to create objects/shapes
  for(let i=0;i<drawn.length && sel!="Pencil";i+=2){
    ellipse(drawn[i], drawn[i+1], 10);
    point(drawn[i], drawn[i+1]);
  }

  //displays a circle highlighting mouse pointer click event on canvas
  if(mouseIsPressed && !options["Export As"].enabled && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && drawable)
    ellipse(mouseX, mouseY, 10);

  //Shows Shapes and Vertices
  push();
  rectMode(CORNERS);
  strokeWeight(2);

  //Shows Preview of (to be created) object
  if (lastpt.length && sel=="Bezier")
    window[sel.toLowerCase()].apply(this, params.slice(0, 2).concat(drawn.slice(4), lastpt, params.slice(2, 4)));
  else if(lastpt.length)
    window[sel.toLowerCase()].apply(this, params.concat(lastpt));
  if(sel == "Pencil" && drawn.length > 0){
    beginShape();
    for(let i=0;i<drawn.length;i+=2)
      vertex(drawn[i], drawn[i+1]);
    endShape();
  }

  //displays all other created shapes
  for(let s of shapes){
    if((s[0]=="Pencil" || s[0]=="Polygon") && s.length > 3){
      beginShape();
      for(let i=1;i<s.length;i+=2)
        vertex(s[i], s[i+1]);
      endShape();
    }
    else if(s[0]=="Pencil")
      s[0]="Point";
    else{
      let tmp = s.slice();
      window[tmp.shift().toLowerCase()].apply(this, tmp);
    }
  }
  pop();

  //Shows Tools/Options/Status Bar
  showStatusBar();
  showToolBar();
  showOptionsBar();

  //Calls Option-specific-functions stored as object name `func` and parameters stored as `param`
  for(let opt in options){
    if(--op >= 0)
      continue;
    if(options[opt].enabled)
      window[options[opt].func].apply(this, options[opt].param);
  }
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
  const cH = prop.canvasH;
  const cY = prop.canvasY;
  const tSize = 10;
  textSize(tSize);
  textAlign(CENTER, CENTER);
  const bound = 20;
  const thick = bound - 2;
  let bX = 0;
  let bY = cY;
  //when mouse hovers over vertical ruler then displace it
  if(mouseX <= bound && mouseY >= cY && mouseY <= cH + cY)
    bX = prop.width - thick;
  //when mouse hovers over horizontal ruler then displace it
  if(mouseY >= cY && mouseY <= cY + bound)
    bY = cY+ cH - thick;
  fill(220,200);
  rect(bX + 1, cY+1, thick, cH - 1);
  rect(1, bY + 1, prop.width, thick);
  fill(0);
  noStroke();
  for(let i=50;i<prop.width;i+=50){
    text(int(i/10), i, bY+thick/2);
    text(int(i/10), bX+thick/2, i+cY+1);
  }
  stroke(0);
  fill(255);
  rect(bX+1, bY+1, thick, thick);
  //shows two mini-red position lines on the ruler indicating mouse position
  if(mouseX >= 0 && mouseX <= prop.width+2 && mouseY >= cY && mouseY <= cY+cH){
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
  drawable=false;
  push();
  rectMode(CENTER);
  textAlign(LEFT, BASELINE);
  textSize(22);
  stroke(0,100).strokeWeight(10);
  rect(prop.export.x+8, prop.export.y+8, 370, 170);//box shadow
  stroke(255, 0, 0).strokeWeight(2).fill(255);
  rect(prop.export.x, prop.export.y, 375, 175);//Rectangle Dialog Box
  stroke(0).strokeWeight(0.5).fill(235);
  rect(prop.export.x - 20, prop.export.y, 260, 35);//Text input box
  fill(0);
  text("Enter Filename :", prop.export.x - 150, prop.export.y - 35);
  text(".txt", prop.export.x + 120, prop.export.y + 7);

  //cursor blink effect
  //one blink takes place every 20 frames
  if(frameCount % 20 > 10)
    name = name.slice(0,-1);//removes cursor which is the last letter in `name`

  text(name, prop.export.x - 145, prop.export.y + 6);//displays user inputted filename

  fill(119, 204, 92);//Green
  rect(prop.export.x + 100, prop.export.y + 50, 100, 35, 5);//Save Button
  fill(255).stroke(255).textFont(code);
  text("SAVE", prop.export.x + 73, prop.export.y + 57);
  pop();
}

/*
  This Function Show guide on using various drawing tools.
  parameter `ind` denotes the index of tab that is selected in help dialog box
*/
function showHelp(ind){
  drawable=false;
  const helps=["Guide", "Shortcuts", "About"];
  --ind;
  push();
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  textSize(22);
  stroke(0,100).strokeWeight(10);
  const wid=500;
  const margin = 20;
  const tabHeight = 30;
  rect(prop.help.x-(wid-6)/2+8, prop.help.y-(wid-6)/2+8 -40, wid - 6, wid - 6 + 40);//box shadow
  const tabs = helps.length;
  stroke(0, 55, 200).strokeWeight(2).fill(135, 234, 138);
  rect(prop.help.x - wid/2, prop.help.y - wid/2 - 40, wid, wid + 40);//Rectangle Dialog Box
  fill(0).stroke(0,100);
  textSize(25);
  text("H E L P", prop.help.x, prop.help.y - wid/2 - ((margin + 40)/2 - margin));
  const space = (wid - 20*2)/tabs;
  stroke(0);
  textSize(18);
  translate(prop.help.x - wid/2, prop.help.y - wid/2);
  for(let i = 0; i<tabs; i++){
    stroke(0);
    if (i == ind)
      fill(255);
    else
      fill(220);
    rect(margin + i * space, margin, space, tabHeight, 10, 10, 0, 0);
    fill(0).stroke(220);
    text(helps[i], margin + space/2 + i * space, margin + tabHeight * 0.5);
  }
  fill(255).stroke(0);
  rect(margin, margin + tabHeight, wid - margin*2, wid - margin*2 - tabHeight);
  stroke(255).strokeCap(SQUARE);
  line(ind*space + margin + 1, margin + tabHeight, ind*space + margin + space - 1, margin + 30);

  //Content
  textAlign(LEFT, TOP);
  textSize(18);
  fill(0).noStroke();
  let posY = margin + margin + 18;
  let posX = margin + margin;
  let indent = 0;
  let start = 0;
  let end = desc.length-1;
  // for(let p in pos){
  for(let iter = 1; iter < Object.keys(pos).length; iter++){
    const p = Object.keys(pos)[iter];
    let str = desc.substring(start, p).trim();
    switch(pos[start].i){
      case 0://bolded string
        break;
      case 1://italisized string
        break;
      case 2://numbered lists
        break;
      case 3://bulleted lists
        break;
      case 4://heading
        let x = 1;
        if(pos[start].r[0][0] == '#')
          x = pos[start].r[0].indexOf(' ');
        else
          ++iter;
        //textSize(30-15*log(x));
        //textSize(85-65*log(x));
        textSize(30-23*log(x));
        console.log(posY);
        textStyle(BOLD);
        text(pos[start].r[1], posX, posY);
        posY += 30-23*log(x);
        console.log(posY);
        textSize(18);
        textStyle(NORMAL);
        start = p;
        break;
      case 5://code segment start/end
        break;
      case 6://function parameters
        break;
      case 7://object variable
        break;
      case 8://function name
        break;
      case 9://newlines
        text(str, posX, posY);
        posY += 18;
        start = p;
        break;
    }
  }
  pop();
  noLoop();
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
  if (!drawable)
    return;
  temp = [mouseX, mouseY]; //stores the mouse pointer clicked/released coordinate
  mag = [];
  //checks and sets magnitude parameter for particular point of the shape
  switch(sel){
    case 'Circle':
      if(pts == 1)
        mag.push(dist(params[0], params[1], temp[0], temp[1]) * 2);
      break;
    case 'Ellipse':
      if (pts == 1){
        mag.push((temp[0] - params[0])*sqrt(8));
        mag.push((temp[1] - params[1])*sqrt(8));
      }
      break;
    case 'Bezier':
      if(pts == 1 && bool){
        params = params.concat(temp);
        lastpt = params.splice(2, 2);
        return;
      }
  }
  if(sel=="Pencil"){
    if(bool)
      drawn = drawn.concat(temp);
  }
  //once mag[] is set then it gets appended to parameter list (i.e params[]) instead of temp[]
  //temp[] gets appended to drawn[] for user-drawn points to be displayed at each step
  else if(bool && pts > 1){
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
    if(Object.values(options)[i].enabled)
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
  fill(0);
  let val=pts+"";
  if(pts < 0)
    val="unlimited";
  if(sel)
    text(sel+" has "+val+" point"+((pts>1||pts<0)?'s ':' ')+'left', 10, prop.statusBarY + prop.statusBarH/2);
  pop();
}

//shows annotations when a shape tool is selected
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
  if(options["Export As"].enabled && mouseX >= prop.export.x - 375/2 && mouseX <= prop.export.x + 375/2 && mouseY >= prop.export.y - 175/2 && mouseY <= prop.export.y + 175/2){
    //when save button from export dialog box is clicked
    if(mouseX>=prop.export.x+50 && mouseX<=prop.export.x+150 && mouseY>=prop.export.y+32.5 && mouseY<=prop.export.y+67.5 && options["Export As"].param[0].length-1){
      let content = ["//Generated by Canvas2D at https://ahmedazhar05.github.io/Canvas2D\n","noFill();","rectMode(CORNERS);","ellipseMode(CENTER);\n"];
      for(let s of shapes){
        if(s[0] == "Pencil"){
          content.push("beginShape();");
          for(let i=1;i<s.length;i+=2)
            content.push("vertex("+s[i]+", "+s[i+1]+");");
          content.push("endShape();");
        }
        else{
          let tmp = s.slice();
          content.push(tmp.shift().toLowerCase()+"("+tmp.reduce((sum,x) => sum +", "+ abs(x.toString()))+");");
        }
      }
      save(content, options["Export As"].param[0].slice(0,-1)+'.txt');
      saved=shapes.length;
      options["Export As"].enabled = false;
      drawable = true;
    }
    //export dialog drag feature enabler
    /*
      375 : Export Dialog Box width,
      175 : Export Dialog Box height,
      15  : Gap
    */
    else if (mouseY <= prop.export.y - 35)
      drag = {pr: (vx, vy)=>{prop.export = {x: constrain(vx, 375/2 + 15, width - 375/2 - 15), y: constrain(vy, 175/2 + 15, height - 175/2 - 15)}}, dx: mouseX - prop.export.x, dy: prop.export.y - mouseY};
  }
  /*
    500 : Help Dialog Box width & height,
    20  : Help Dialog Box margin on all sides,
    30  : Help Dialog Tab height,
    40  : 'HELP' title height
    15  : Gap
  */
  else if(options["Help"].enabled && mouseX >= prop.help.x - 500/2 && mouseX <= prop.help.x + 500/2 && mouseY >= prop.help.y - 500/2 - 40 && mouseY <= prop.help.y + 500/2){
    //help dialog drag feature enabler
    if (mouseY <= prop.help.y - 500/2)
      drag = {pr: (vx, vy)=>{prop.help = {x: constrain(vx, 500/2+15, width-500/2-15), y: constrain(vy, 500/2+40+15, height-500/2-15)}}, dx: mouseX - prop.help.x, dy: prop.help.y - mouseY};
    else if (mouseX >= (prop.help.x - 500/2 + 20) && mouseX <= (prop.help.x + 500/2 - 20) && mouseY >= (prop.help.y - 500/2 + 20) && mouseY <= (prop.help.y - 500/2 + 20)+30)
      options["Help"].param[0] = int((mouseX - (prop.help.x - 500/2 + 20))/((500 - 20 - 20)/3/*no of tabs in help dialog box*/)) + 1;
  }
  else {
    //shape tool selection from toolbar
    if(mouseY >= prop.toolBarY && mouseY <= prop.toolBarY + prop.toolBarH){
      let ind = floor(mouseX/prop.toolGap);
      if(sel == Object.keys(tools)[ind]){
        sel = ann = null;
        pts = 0;
      } else {
        sel=Object.keys(tools)[ind];
        pts=tools[sel].length;
        if(sel == "Pencil")
          pts = -1;
        ann=(tools[sel])[abs(pts)-1];
      }
      params = drawn = [];
    }
    //option selection from optionsbar and toggling its enability
    else if(mouseY >= prop.optionsBarY && mouseY <= prop.optionsBarY+prop.optionsBarH){
      let opt = Object.keys(options)[floor(mouseX/prop.optionsGap)];
      options[opt].enabled = !options[opt].enabled;
      drawable = true;
    }
    //permanent point drawn when pencil tool is selected and clicked on canvas
    else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel=="Pencil" && drawable)
      makeParam(true);
    //temporary point added when shape tool is selected and clicked on canvas
    else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && pts == 1 && drawable)
      makeParam(false);
  }
}

function mouseReleased(){
  drag = {};
  cursor(ARROW);
  if(mouseX >= 0 && mouseX <= prop.width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel=="Pencil" && drawable){
    makeParam(false);
    shapes.push(["Pencil"].concat(drawn));
    pts = 0;
    if(options["Non Stop"].enabled){
      pts = -1;
      ann = (tools[sel])[abs(pts)-1];
    }
    else
      sel = ann = null;
    drawn = temp = [];
  }
  //permanent addtion of points in drawn[]
  //addition of params[] to shapes when object's final point is created
  else if(mouseX >= 0 && mouseX <= prop.width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && drawable){
    makeParam(true);
    --pts;
    ann = (tools[sel])[pts-1];
    if(!pts){
      shapes.push([sel].concat(params, lastpt));
      params = lastpt = drawn = [];
      if(options["Non Stop"].enabled){
        pts = tools[sel].length;
        ann = (tools[sel])[abs(pts)-1];
      }
      else
        sel = ann = null;
    }
    temp = [];
  }
}

function mouseDragged(){
  if(sel && drawable){
    if(mouseX >= 0 && mouseX <= width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel=="Pencil")
      makeParam(true);
    //preview shape when last point of the object is being drawn/dragged by temporarily adding point into drawn
    else if(mouseX >= 0 && mouseX <= width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && pts == 1)
      makeParam(false);
  }
  else if(typeof drag.pr != 'undefined'/* && mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height*/){
    drag.pr(mouseX - drag.dx, mouseY + drag.dy);
    cursor(MOVE);
  }
}

function voidfunc(){
  null;
}

function keyPressed(){
  if(options["Export As"].enabled){
    //Export Filename Input
    if(options["Export As"].param[0].length < 12 && (keyCode>=65 && keyCode<=90 || keyCode>=48 && keyCode<=57 || keyCode>=96 && keyCode<=105 || key=='-' || key=='_'))
      options["Export As"].param[0] = options["Export As"].param[0].slice(0,-1)+key+'|';
    else if(keyCode == 8 && options["Export As"].param[0].length > 1)
      options["Export As"].param[0] = options["Export As"].param[0].slice(0,-2)+'|';
    //File Save
    else if(options["Export As"].param[0].length-1 && keyCode == 13){
      let content = ["//Generated by Canvas2D at https://ahmedazhar05.github.io/Canvas2D\n","noFill();","rectMode(CORNERS);","ellipseMode(CENTER);\n"];
      for(let s of shapes){
        if(s[0] == "Pencil"){
          content.push("beginShape();");
          for(let i=1;i<s.length;i+=2)
            content.push("vertex("+s[i]+", "+s[i+1]+");");
          content.push("endShape();");
        }
        else{
          let tmp = s.slice();
          content.push(tmp.shift().toLowerCase()+"("+tmp.reduce((sum,x) => sum +", "+ abs(x.toString()))+");");
        }
      }
      save(content, options["Export As"].param[0].slice(0,-1)+'.txt');
      saved=shapes.length;
      options["Export As"].enabled = false;
      drawable = true;
    }
  }
  else if(keyIsDown(17) && keyCode == 90){
    shapes.pop();
  }
}

window.addEventListener('beforeunload', (event) => {
  if(saved < shapes.length){
    event.preventDefault();
    event.returnValue = false;
  }
});

//add helper contents
