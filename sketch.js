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
let demo; //stores demo shapes values

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

  saved = 0;

  demo = {
    k : 0,
    dx : 0,
    dy : 0,
    rad : 0,
  };

  //stores all the user created shapes
  shapes = [];

  //stores various options with parameters
  options = {
    "Non Stop" : {enabled : true, func : 'voidfunc'},
    "Show Grid" : {enabled : false, func : 'showGrid'},
    "Show Ruler" : {enabled : false, func : 'showRuler'},
    "Show Annotation" : {enabled : true, func : 'showAnnotation'},
    "Help" : {enabled : false, func : 'showHelp', param : [1, 0]},
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
function showHelp(ind, t){
  drawable=false;
  const helps=["Demo", "Shortcuts", "About"];
  const wid = 500;
  const margin = 20;
  const tabHeight = 30;
  const tabs = helps.length;
  const space = (wid - 20*2)/tabs;
  --ind;
  push();
  rectMode(CORNER);
  textAlign(CENTER, CENTER);
  textSize(22);
  stroke(0,100).strokeWeight(10);
  rect(prop.help.x-(wid-6)/2+8, prop.help.y-(wid-6)/2+8 -40, wid - 6, wid - 6 + 40);//box shadow
  stroke(0, 55, 200).strokeWeight(2).fill(255);
  rect(prop.help.x - wid/2, prop.help.y - wid/2 - 40, wid, wid + 40);//Rectangle Dialog Box
  fill(0).stroke(0,100);
  textSize(25);
  text("H E L P", prop.help.x, prop.help.y - wid/2 - ((margin + 40)/2 - margin));
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
  stroke(255).strokeCap(SQUARE).strokeWeight(3);
  line(ind*space + margin + 1, margin + tabHeight, ind*space + margin + space - 1, margin + 30);

  //DEMO
  if (ind == 0) {
    textSize(30);
    textAlign(CENTER, CENTER);
    const shifterWd = 40;
    const shifterHt = textSize()+10;
    fill(220).noStroke();//.stroke(0).strokeWeight(1);
    //left shifter button
    rect(margin*2, margin*2 + tabHeight, shifterWd, shifterHt);
    // //right shifter button
    rect(wid - margin*2 - shifterWd, margin*2 + tabHeight, shifterWd, shifterHt);

    fill(230);
    rect(margin*2+shifterWd+1, margin*2 + tabHeight, wid - margin*4 - shifterWd*2 -2, shifterHt);

    fill(0).textStyle(BOLD);
    text(Object.keys(tools)[t], wid/2, margin*2+tabHeight+shifterHt/2);
    textStyle(NORMAL).textSize(20);
    text("<", margin*2 + shifterWd/2, margin*2 + tabHeight + shifterHt/2);
    text(">", wid - margin*2 - shifterWd/2, margin*2 + tabHeight + shifterHt/2);
    noFill().stroke(200).strokeWeight(1);
    rect(margin*2 + 1, margin*2 + tabHeight + shifterHt + 1, wid - margin*4 - 2, wid - margin*4 - tabHeight - shifterHt - 2);
    stroke(0);
    translate(margin*2, margin*2 + tabHeight + shifterHt);
    strokeWeight(2);

    if(t == 0){
      if(round(demo.dx) == round(demo.vtx[demo.k][0]) && round(demo.dy) == round(demo.vtx[demo.k][1])){
        ++demo.k;
        if(demo.k == Object.keys(demo.vtx).length){
          --demo.k;
          demo.dx -= 1;
          demo.dy -= 1;
          demo.pause = 60;
        }
        demo.rad = (demo.k==0 || demo.k==3 || demo.k==11 || demo.k==25 || demo.pause)? 0:5;
      } else if(demo.pause < 1){
        demo.dx = lerp(demo.dx, demo.vtx[demo.k][0], 0.5);
        demo.dy = lerp(demo.dy, demo.vtx[demo.k][1], 0.5);
      } else 
        demo.k = (!(--demo.pause))?0:demo.k;
      const bks=[0,3,11,25,29];
      for(let j=0; j<bks.length-1; j++){
        beginShape();
        for(let i=bks[j]; i<bks[j+1] && i<demo.k; i++)
          vertex(demo.vtx[i][0], demo.vtx[i][1]);
        endShape();
      }
      demoMouse(demo.dx, demo.dy, demo.rad);
    } else {
      if(round(demo.dx) == round(demo.vtx[demo.k][0]) && round(demo.dy) == round(demo.vtx[demo.k][1]) && round(demo.rad) < 5){
        demo.rad = lerp(demo.rad, 5, 0.3);
      } else if(demo.rad > 5-1){
        ++demo.k;
        if(demo.k == Object.keys(demo.vtx).length){
          demo.k = 0;
          demo.pause = 60;
          window[Object.keys(tools)[t].toLowerCase()].apply(this, demo.pmt);
        }
        demo.rad = 0;
      } else if(demo.pause < 1){
        demo.dx = lerp(demo.dx, demo.vtx[demo.k][0], 0.1);
        demo.dy = lerp(demo.dy, demo.vtx[demo.k][1], 0.1);
      } else {
        window[Object.keys(tools)[t].toLowerCase()].apply(this, demo.pmt);
        --demo.pause;
      }
      strokeWeight(1);
      for(let i=0;i<demo.k;i++){
        ellipse(demo.vtx[i][0], demo.vtx[i][1], 10);
        point(demo.vtx[i][0], demo.vtx[i][1]);
      }
      strokeWeight(2);
      demoMouse(demo.dx, demo.dy, demo.rad);
    }
  }
  pop();
}

function demoMouse(x, y, r) {
  push();
  inc=1.5;
  translate(x, y);
  if(r != 0){
    noFill().stroke(255, 0, 0).strokeWeight(2);
    circle(0, 0, r*2);
  }
  fill(255).stroke(0).strokeWeight(1);
  beginShape();
  vertex(8*inc,17*inc);//bottom right stick out
  vertex(6*inc,13*inc);//botton right inner
  vertex(11*inc,13*inc);//arrow head right out
  vertex(0,0);//action point
  vertex(0,17*inc);//arrow head left out
  vertex(3.5*inc,14*inc);//bottom left inner
  vertex(5*inc,18.5*inc);//bottom left stick out
  endShape(CLOSE);
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
function makeParam(x, y, bool){
  if (!drawable)
    return;
  temp = [x, y]; //stores the mouse pointer clicked/released coordinate
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
  if (mouseX > 0 && mouseX < width && mouseY > prop.canvasY+1 && mouseY < prop.canvasY+prop.canvasH-1) {
    textAlign(RIGHT, CENTER);
    text("Pen : "+mouseX+', '+(mouseY-80), width-10, prop.statusBarY + prop.statusBarH/2);
  }
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
    const widH = 375/2;
    const heiH = 175/2;
    const gap = 15;
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
      drag = {pr: (vx, vy)=>{prop.export = {x: constrain(vx, widH + gap, width - widH - gap), y: constrain(vy, heiH + gap, height - heiH - gap)}}, dx: mouseX - prop.export.x, dy: prop.export.y - mouseY};
  }
  /*
    500 : Help Dialog Box width & height,
    20  : Help Dialog Box margin on all sides,
    30  : Help Dialog Tab height,
    40  : 'HELP' title height
    15  : Gap
  */
  else if(options["Help"].enabled && mouseX >= prop.help.x - 500/2 && mouseX <= prop.help.x + 500/2 && mouseY >= prop.help.y - 500/2 - 40 && mouseY <= prop.help.y + 500/2){
    const widH = 500/2;
    const margin = 20;
    const gap = 15;
    const tabHeight = 30;
    const shifterHt = 40;
    const shifterWd = 40;
    //help dialog drag feature enabler
    if (mouseY <= prop.help.y - widH)
      drag = {pr: (vx, vy)=>{prop.help = {x: constrain(vx, widH+gap, width-widH-gap), y: constrain(vy, widH+40/*'HELP' title height*/+gap, height-widH-gap)}}, dx: mouseX - prop.help.x, dy: prop.help.y - mouseY};
    else if (mouseX >= (prop.help.x - widH + margin) && mouseX <= (prop.help.x + widH - margin) && mouseY >= (prop.help.y - widH + margin) && mouseY <= (prop.help.y - widH + margin)+tabHeight)
      options["Help"].param[0] = int((mouseX - (prop.help.x - widH + margin))/((widH*2 - margin*2)/3/*no of tabs in help dialog box*/)) + 1;
    else if(options["Help"].param[0]==1 && mouseY >= (prop.help.y - widH + margin*2 + tabHeight) && mouseY <= (prop.help.y - widH + margin*2 + tabHeight + shifterHt)){
      if(mouseX >= (prop.help.x - widH + margin*2) && mouseX <= (prop.help.x - widH + margin*2 + shifterWd))
        options["Help"].param[1] -= 1;
      else if(mouseX >= (prop.help.x + widH - margin*2 - shifterWd) && mouseX <= (prop.help.x + widH - margin*2))
        options["Help"].param[1] += 1;
      options["Help"].param[1] = (options["Help"].param[1] + Object.keys(tools).length) % Object.keys(tools).length;
      switch(options["Help"].param[1]){
        case 0:
          demo = {vtx:[[31, 68],[38, 114],[40, 131],[30, 67],[45, 66],[47, 66],[53, 75],[53, 84],[48, 90],[32, 100],[24, 101],[68, 37],[67, 57],[69, 61],[80, 53],[87, 50],[89, 50],[92, 52],[95, 60],[95, 66],[95, 72],[89, 84],[79, 91],[66, 92],[64, 90],[68, 37],[86, 34],[97, 33],[106, 31]],};
          break;
        case 1:
          demo = {vtx:[[29, 29],[118, 122],[82, 22],[62, 115]], pmt:[29, 29, 82, 22, 62, 115, 118, 122]};
          break;
        case 2:
          demo = {vtx:[[75, 75], [124, 99]], pmt:[75, 75, 138.59292911256333, 67.88225099390857]};
          break;
        case 3:
          demo = {vtx:[[75, 75],[108, 117]], pmt:[75, 75, 106.82696288858912]};
          break;
        case 4:
          demo = {vtx:[[20, 46],[127, 93]], pmt:[20, 46, 127, 93]};
          break;
        case 5:
          demo = {vtx:[[63, 67],[83, 47]], pmt:[63, 67]};
          break;
        case 6:
          demo = {vtx:[[20, 113], [124, 115], [101, 34], [45, 22]], pmt:[20, 113, 124, 115, 101, 34, 45, 22]};
          break;
        case 7:
          demo = {vtx:[[46, 24], [101, 130]], pmt:[46, 24, 55, 106]};
          break;
        case 8:
          demo = {vtx:[[63, 26], [34, 126], [126, 91]], pmt:[63, 26, 34, 126, 126, 91]};
          break;
      }
      demo.dx = demo.vtx[0][0]-10;
      demo.dy = demo.vtx[0][1]-10;
      demo.k = 0;
      demo.rad = 0;
      demo.pause = 0;
    }
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
      if (options["Help"].enabled){
        options["Help"].param[1] = 7;
        demo = {
          vtx:[[46, 24], [101, 130]],
          pmt:[46, 24, 55, 106],
          dx : 36,
          dy : 14,
          k : 0,
          rad : 0,
          pause : 0,
        }
        /*demo = {
          k : 0,
          rad: 0,
          vtx:[[31, 68],[38, 114],[40, 131],[30, 67],[45, 66],[47, 66],[53, 75],[53, 84],[48, 90],[32, 100],[24, 101],[68, 37],[67, 57],[69, 61],[80, 53],[87, 50],[89, 50],[92, 52],[95, 60],[95, 66],[95, 72],[89, 84],[79, 91],[66, 92],[64, 90],[68, 37],[86, 34],[97, 33],[106, 31]],
          dx : 31-10,
          dy : 68-10,
          pause : 0,
        };*/
      }
      drawable = true;
    }
    //permanent point drawn when pencil tool is selected and clicked on canvas
    else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel=="Pencil" && drawable)
      makeParam(mouseX, mouseY, true);
    //temporary point added when shape tool is selected and clicked on canvas
    else if(mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel && pts == 1 && drawable)
      makeParam(mouseX, mouseY, false);
  }
}

function mouseReleased(){
  drag = {};
  cursor(ARROW);
  if(mouseX >= 0 && mouseX <= prop.width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && sel=="Pencil" && drawable){
    makeParam(mouseX, mouseY, false);
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
    makeParam(mouseX, mouseY, true);
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
      makeParam(mouseX, mouseY, true);
    //preview shape when last point of the object is being drawn/dragged by temporarily adding point into drawn
    else if(mouseX >= 0 && mouseX <= width && mouseY >= prop.canvasY && mouseY <= prop.canvasY+prop.canvasH && pts == 1)
      makeParam(mouseX, mouseY, false);
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
