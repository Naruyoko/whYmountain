var canvas;
var ctx;
var cursorstr="▮";
var cursorendstr="▯";
var lineBreakRegex=/\r?\n/g;
var itemSeparatorRegex=/[\t ,]/g;
window.onload=function (){
  console.clear();
  canvas=dg("output");
  ctx=canvas.getContext("2d");
  dg('input').onkeydown=handlekey;
  dg('input').onfocus=handlekey;
  dg('input').onmousedown=handlekey;
  load();
  draw(true);
  drawIntervalLoopFunc();
}
function drawIntervalLoopFunc(){
  setTimeout(e=>draw(true)+drawIntervalLoopFunc(),100);
}
function dg(s){
  return document.getElementById(s);
}
var calculatedMountains=null;
function parseSequenceElement(s,i){
  var strremoved=s;
  if (strremoved.indexOf(cursorstr)!=-1){
    strremoved=strremoved.substring(0,strremoved.indexOf(cursorstr))+strremoved.substring(strremoved.indexOf(cursorstr)+1);
  }
  if (strremoved.indexOf(cursorendstr)!=-1){
    strremoved=strremoved.substring(0,strremoved.indexOf(cursorendstr))+strremoved.substring(strremoved.indexOf(cursorendstr)+1);
  }
  if (strremoved.indexOf("v")==-1||!isFinite(Number(strremoved.substring(strremoved.indexOf("v")+1)))){
    var numval=Number(strremoved);
    return {
      value:numval,
      strexp:getstrexp(s,strremoved),
      position:i,
      parentIndex:-1
    };
  }else{
    return {
      value:Number(strremoved.substring(0,strremoved.indexOf("v"))),
      strexp:getstrexp(s,strremoved),
      position:i,
      parentIndex:Math.max(Math.min(i-1,Number(strremoved.substring(strremoved.indexOf("v")+1))),-1),
      forcedParent:true
    };
  }
}
function calc(s){
  //if (!/^(\d+,)*\d+$/.test(s)) throw Error("BAD");
  var lastLayer;
  if (typeof s=="string"){
    lastLayer=s.split(itemSeparatorRegex).map(parseSequenceElement);
  }
  else lastLayer=s;
  var calculatedMountain=[lastLayer]; //rows
  while (true){
    //assign parents
    var hasNextLayer=false;
    for (var i=0;i<lastLayer.length;i++){
      if (lastLayer[i].forcedParent) continue;
      var p;
      if (calculatedMountain.length==1){
        p=lastLayer[i].position+1;
      }else{
        p=0;
        while (calculatedMountain[calculatedMountain.length-2][p].position<lastLayer[i].position+1) p++;
      }
      while (true){
        if (p<0) break;
        var j;
        if (calculatedMountain.length==1){
          p--;
          j=p-1;
        }else{ //ignoring
          p=calculatedMountain[calculatedMountain.length-2][p].parentIndex;
          if (p<0) break;
          j=0;
          while (lastLayer[j].position<calculatedMountain[calculatedMountain.length-2][p].position-1) j++;
        }
        if (j<0||j<lastLayer.length-1&&lastLayer[j].position+1!=lastLayer[j+1].position) break;
        if (lastLayer[j].value<lastLayer[i].value){
          lastLayer[i].parentIndex=j;
          hasNextLayer=true;
          break;
        }
      }
    }
    if (!hasNextLayer) break;
    var currentLayer=[];
    calculatedMountain.push(currentLayer);
    for (var i=0;i<lastLayer.length;i++){
      if (lastLayer[i].parentIndex!=-1){
        currentLayer.push({value:lastLayer[i].value-lastLayer[lastLayer[i].parentIndex].value,position:lastLayer[i].position-1,parentIndex:-1});
      }
    }
    lastLayer=currentLayer;
  }
  return calculatedMountain;
}
function getstrexp(s,strremoved){
  if (typeof strremoved=="undefined"){
    strremoved=s;
    if (strremoved.indexOf(cursorstr)!=-1){
      strremoved=strremoved.substring(0,strremoved.indexOf(cursorstr))+strremoved.substring(strremoved.indexOf(cursorstr)+1);
    }
    if (strremoved.indexOf(cursorendstr)!=-1){
      strremoved=strremoved.substring(0,strremoved.indexOf(cursorendstr))+strremoved.substring(strremoved.indexOf(cursorendstr)+1);
    }
  }
  if (strremoved.indexOf("v")==-1||!isFinite(Number(strremoved.substring(strremoved.indexOf("v")+1)))){
    return s;
  }else{
    if (s.indexOf(cursorstr)!=-1&&s.indexOf(cursorstr)>s.indexOf("v")||s.indexOf(cursorendstr)!=-1&&s.indexOf(cursorendstr)>s.indexOf("v")){
      return s;
    }else{
      return s.substring(0,s.indexOf("v"));
    }
  }
}
function updateMountainString(){
  for (var lines=inputc.split(lineBreakRegex),i=0;i<lines.length;i++){
    for (var nums=lines[i].split(itemSeparatorRegex),j=0;j<nums.length;j++){
      calculatedMountains[i][0][j].strexp=getstrexp(nums[j]);
    }
  }
}
var options=["input","ROWHEIGHT","COLUMNWIDTH","LINETHICKNESS","NUMBERSIZE","NUMBERTHICKNESS","LINEPLACE"];
var input="";
var inputc="";
var ROWHEIGHT=32;
var COLUMNWIDTH=32;
var LINETHICKNESS=2;
var NUMBERSIZE=10;
var NUMBERTHICKNESS=400;
var LINEPLACE=1;
var inputFocused=false;
var timesDrawn=0;
var finalDrawn=0;
var doneDrawn=0;
function draw(recalculate){
  var inputChanged=input!=dg("input").value;
  var optionChanged=false;
  for (var i of options){
    if (window[i]!=dg(i).value) optionChanged=true;
    window[i]=dg(i).value;
  }
  var curpos=form.input.selectionStart;
  var curendpos=form.input.selectionEnd;
  var newinputc;
  if (!inputFocused){
    newinputc = input;
  }else if (curpos==curendpos){
    newinputc = input.substring(0,curpos)+cursorstr+input.substring(curpos);
  }else{
    newinputc = input.substring(0,curpos)+cursorstr+input.substring(curpos,curendpos)+cursorendstr+input.substring(curendpos);
  }
  if (!optionChanged&&inputc==newinputc) return;
  inputc=newinputc;
  if (recalculate&&inputChanged) calculatedMountains=inputc.split(lineBreakRegex).map(calc);
  else updateMountainString();
  //get image size
  var x=0;
  var y=0;
  for (var i=0;i<calculatedMountains.length;i++){
    var mountain=calculatedMountains[i];
    x=Math.max(x,mountain[0].length*COLUMNWIDTH);
    y+=mountain.length*ROWHEIGHT;
  }
  //resize
  canvas.width=x;
  canvas.height=y;
  ctx.fillStyle="white"; //clear
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="black";
  ctx.strokeStyle="black";
  ctx.lineWidth=+LINETHICKNESS;
  ctx.font=NUMBERTHICKNESS+" "+NUMBERSIZE+"px Arial";
  var by=0;
  for (var i=0;i<calculatedMountains.length;i++){
    var mountain=calculatedMountains[i];
    for (var j=0;j<mountain.length;j++){
      var row=mountain[j];
      for (var k=0;k<row.length;k++){
        var point=row[k];
        ctx.fillText(j==0?point.strexp:point.value,COLUMNWIDTH*(point.position*2+j+1)/2-ctx.measureText(j==0?point.strexp:point.value).width/2,by+ROWHEIGHT*(mountain.length-j)-3);
        if (j>0){
          ctx.beginPath();
          ctx.moveTo(COLUMNWIDTH*(point.position*2+j+2)/2,by+ROWHEIGHT*(mountain.length-j+1)-NUMBERSIZE*Math.min(LINEPLACE,1)-(ROWHEIGHT-NUMBERSIZE)*Math.max(LINEPLACE-1,0)-3);
          ctx.lineTo(COLUMNWIDTH*(point.position*2+j+1)/2,by+ROWHEIGHT*(mountain.length-j));
          var l=0;
          while (mountain[j-1][l].position!=point.position+1) l++;
          ctx.lineTo(COLUMNWIDTH*(mountain[j-1][mountain[j-1][l].parentIndex].position*2+j)/2,by+ROWHEIGHT*(mountain.length-j+1)-NUMBERSIZE*Math.min(LINEPLACE,1)-(ROWHEIGHT-NUMBERSIZE)*Math.max(LINEPLACE-1,0)-3);
          ctx.stroke();
        }
      }
    }
    by+=mountain.length*ROWHEIGHT;
  }
  //enable save
  if (canvas.toBlob&&Promise&&URL&&URL.createObjectURL){
    timesDrawn++;
    (function (timesDrawn){
      new Promise(function (resolve,reject){
        canvas.toBlob(
          function callback(blob){
            resolve(blob);
          },
          "image/png"
        );
      }).then(function (blob){
        doneDrawn++;
        if (blob&&timesDrawn>finalDrawn){
          finalDrawn=timesDrawn;
          URL.revokeObjectURL(outimg.src);
          outimg.src=URL.createObjectURL(blob);
        }
        updateDrawnStatus();
      });
    })(timesDrawn);
  }else{
    outimg.width=canvas.width;
    outimg.height=canvas.height;
    outimg.src=canvas.toDataURL('image/png');
  }
  updateDrawnStatus();
}
function updateDrawnStatus(){
  var d=dg("drawStatus");
  if (timesDrawn==doneDrawn){
    d.style.display="none";
  }else{
    d.style.display="";
    d.innerHTML="Rendering: "+finalDrawn+" - "+doneDrawn+"/"+timesDrawn;
  }
}
window.onpopstate=function (e){
  load();
  draw(true);
}
function saveSimple(clipboard){
  var encodedInput=input.split(lineBreakRegex).map(e=>e.split(itemSeparatorRegex).map(parseSequenceElement).map(e=>e.forcedParent?e.value+"v"+e.parentIndex:e.value)).join(";");
  history.pushState(encodedInput,"","?"+encodedInput);
  if (clipboard){
    var copyarea=dg("copyarea");
    copyarea.value=location.href;
    copyarea.style.display="";
    copyarea.select();
    copyarea.setSelectionRange(0,99999);
    document.execCommand("copy");
    copyarea.style.display="none";
  }
}
function saveDetailed(clipboard){
  var state={};
  for (var i of options){
    state[i]=window[i];
  }
  var encodedState=btoa(JSON.stringify(state)).replace(/\+/g,"-").replace(/\//g,"_").replace(/\=/g,"");
  history.pushState(state,"","?"+encodedState);
  if (clipboard){
    var copyarea=dg("copyarea");
    copyarea.value=location.href;
    copyarea.style.display="";
    copyarea.select();
    copyarea.setSelectionRange(0,99999);
    document.execCommand("copy");
    copyarea.style.display="none";
  }
}
function load(){
  var encodedState=location.search.substring(1);
  if (!encodedState) return;
  try{
    var state=encodedState.replace(/\-/g,"+").replace(/_/g,"/");
    if (state.length%4) state+="=".repeat(4-state.length%4);
    state=JSON.parse(atob(state));
  }catch (e){ //simple
    var input=encodedState.replace(/;/g,"\r\n");
    dg("input").value=input;
  }finally{ //detailed
    console.log(state);
    for (var i of options){
      if (state[i]) dg(i).value=state[i];
    }
  }
}
/*function calcDiagonal(mountain){
  if (typeof mountain=="string") mountain=calc(mountain);
  var height=0;
  var position=mountain[0].length-1;
  while (mountain[height+1]&&mountain[height+1][mountain[height+1].length-1].position==position-1){ //climb up to the peak
    height++;
    position--;
  }
  var lastIndex=mountain[height].length-1;
  var gezandoIndexes=[[lastIndex]]; //indexes of gezando nodes
  while (gezandoIndexes.length<=height) gezandoIndexes.unshift([]);
  while (true){
    if (height===0){
      if (lastIndex===0) break;
      lastIndex--;
    }else{
      var i=0; //find right-down
      while (mountain[height-1][i].position!=mountain[height][lastIndex].position+1) i++;
      i=mountain[height-1][i].parentIndex; //go to its parent=left-down
      var j=0; //find up-left of that=left
      while (mountain[height][j].position<mountain[height-1][i].position-1) j++;
      if (mountain[height][j].position==mountain[height-1][i].position-1){ //left exists
        lastIndex=j;
        gezandoIndexes[height-1].unshift(i);
      }else{
        height--;
        lastIndex=i;
      }
    }
    gezandoIndexes[height].unshift(lastIndex);
  }
  var lastTreeLevel=new Set();
  var treeLevelParent=new Map();
  for (var i=0;i<mountain[0].length;i++){
    lastTreeLevel.add(i);
    treeLevelParent.set(i,mountain[0][i].parentIndex);
  }
  var treeNodeIndexes=[lastTreeLevel];
  var treeNodeParent=[treeLevelParent];
  while (height<mountain.length-1){
    var treeLevel=new Set(gezandoIndexes[height+1]);
    var treeLevelParent=new Map();
    if (gezandoIndexes[height+1]){
      for (var i=0;i<gezandoIndexes[height+1].length;i++){
        var j=0; //find right-down
        while (mountain[height][j].position!=mountain[height+1][i].position+1) j++;
        j=mountain[height][j].parentIndex; //go to its parent=left-down
        treeLevelParent.set(i,mountain[height][j].position+height);
      }
    }
    for (var i=0;i<mountain[height].length;i++){
      if (lastTreeLevel.has(mountain[height][i].parentIndex)){
        var j=0;
        while (mountain[height+1][j].position<mountain[height][i].position-1) j++;
        treeLevel.add(j);
        treeLevelParent.set(j,mountain[height][mountain[height][i].parentIndex].position+height);
      }
    }
    for (var i=0;i<mountain[height+1].length;i++){
      var j=0; //find right-down
      while (mountain[height][j].position!=mountain[height+1][i].position+1) j++;
      j=mountain[height][j].parentIndex; //go to its parent=left-down
      var k=0; //find up-left of that=left
      while (mountain[height+1][k].position<mountain[height][j].position-1) k++;
      if (mountain[height+1][k].position==mountain[height][j].position-1){ //left exists
        treeLevel.add(i);
        treeLevelParent.set(i,mountain[height+1][k].position+height+1);
      }
    }
    lastTreeLevel=treeLevel;
    treeNodeIndexes.push(lastTreeLevel);
    treeNodeParent.push(treeLevelParent);
    height++;
  }
  var t=[];
  var ts=[];
  var th=[];
  var tps=[];
  for (var i=0;i<mountain[0].length;i++){ //only one diagonal exists for each left-side-up diagonal line
    for (var j=mountain.length-1;j>=0;j--){ //prioritize the top
      var found=false;
      for (var k=mountain[j].length-1;k>=0;k--){
        if (treeNodeIndexes[j].has(k)&&mountain[j][k].position+j==i){
          t.push(mountain[j][k].value);
          ts.push(i);
          th.push(j);
          tps.push(treeNodeParent[j].get(k));
          found=true;
          break;
        }
      }
      if (found) break;
    }
  }
  var pw=[];
  for (var i=0;i<t.length;i++){
    var p=-1;
    for (var j=i-1;j>=0;j--){
      if (t[j]<t[i]){
        p=j;
        break;
      }
    }
    pw.push(p);
  }
  var r=[];
  for (var i=0;i<t.length;i++){
    var p=-1;
    var ps=ts[i];
    while (true){
      ps=tps[ts.indexOf(ps)];
      if (ps<0) break;
      if (t[ps]<t[i]&&th[ps]<=th[i]){
        p=ps;
        break;
      }
    }
    if (p==pw[i]) r.push(t[i]);
    else r.push(t[i]+"v"+p);
  }
  console.log(gezandoIndexes);
  console.log(treeNodeIndexes);
  console.log(treeNodeParent);
  return r.join(",");
}*/
function calcDiagonal(mountain){
  var diagonal=[];
  var diagonalTree=[];
  for (var i=0;i<mountain[0].length;i++){ //only one diagonal exists for each left-side-up diagonal line
    for (var j=mountain.length-1;j>=0;j--){ //prioritize the top
      var k=0;
      while (k<mountain[j].length&&mountain[j][k].position+j<i) k++;
      if (!mountain[j][k]||mountain[j][k].position+j!=i) continue;
      var height=j;
      var lastIndex=k;
      while (true){
        if (height==0){
          lastIndex=mountain[height][lastIndex].parentIndex;
        }else{
          var l=0; //find right-down
          while (mountain[height-1][l].position!=mountain[height][lastIndex].position+1) l++;
          l=mountain[height-1][l].parentIndex; //go to its parent=left-down
          var m=0; //find up-left of that=left
          while (mountain[height][m].position<mountain[height-1][l].position-1) m++;
          if (mountain[height][m].position==mountain[height-1][l].position-1){ //left exists
            lastIndex=m;
          }else{
            height--;
            lastIndex=l;
          }
        }
        if (!mountain[height][lastIndex]||mountain[height][lastIndex].parentIndex==-1){
          diagonal.push(mountain[j][k].value);
          diagonalTree.push((mountain[height][lastIndex]?mountain[height][lastIndex].position:-1)+height);
          break;
        }
      }
      break;
    }
  }
  var pw=[];
  for (var i=0;i<diagonal.length;i++){
    var p=-1;
    for (var j=i-1;j>=0;j--){
      if (diagonal[j]<diagonal[i]){
        p=j;
        break;
      }
    }
    pw.push(p);
  }
  var r=[];
  for (var i=0;i<diagonal.length;i++){
    var p=i;
    while (true){
      p=diagonalTree[p];
      if (p<0||diagonal[p]<diagonal[i]) break;
    }
    if (p==pw[i]) r.push(diagonal[i]);
    else r.push(diagonal[i]+"v"+p);
  }
  console.log(diagonalTree);
  return r.join(",");
}
var ontabopen={};
var tabs=["input","extractDiagonal"];
function openTab(name){
  for (var i of tabs){
    dg(i+"Tab").style.display="none";
  }
  dg(name+"Tab").style.display="";
  if (ontabopen[name] instanceof Function) ontabopen[name]();
}
ontabopen["extractDiagonal"]=function (){
  var l=dg("extractDiagonal");
  l.innerHTML="";
  var lines=input.split(lineBreakRegex);
  for (var i in lines){
    var d=document.createElement("li");
    var e=document.createElement("u");
    e.textContent=lines[i];
    e.onclick=new Function("extractDiagonal("+i+")");
    d.appendChild(e);
    l.appendChild(d);
  }
}
function extractDiagonal(line){
  var startTime=Date.now();
  var lastSequence=calculatedMountains[line];
  for (var cycles=0;cycles<extractDiagonalModesCount[extractDiagonalMode];cycles++){
    var diagonal=calcDiagonal(lastSequence);
    if (cycles>0){
      var lastSequenceText=lastSequence;
      if (lastSequence instanceof Array) lastSequenceText=lastSequence[0].map(e=>e.forcedParent?e.value+"v"+e.parentIndex:e.value).join(",");
      //console.log(diagonal);
      //console.log(lastSequenceText);
      if (diagonal==lastSequenceText) break;
      var lastItemOfDiagonal=diagonal.split(",")[diagonal.split(",").length-1];
      if (!(Number(lastItemOfDiagonal.indexOf("v")==-1?lastItemOfDiagonal:lastItemOfDiagonal.substring(0,lastItemOfDiagonal.indexOf("v")))>1)) break;
      if (!diagonal.split(",").map(e=>e.indexOf("v")==-1?Number(e):Number(e.substring(0,e.indexOf("v")))).every(e=>isFinite(e)&&e>0)) break;
    }
    if (extractDiagonalMode==4&&Date.now()-startTime>5000) break;
    lastSequence=diagonal;
    dg("input").value+="\r\n"+diagonal;
  }
  draw(true);
  ontabopen["extractDiagonal"]();
}
var extractDiagonalMode=0;
var extractDiagonalModes=["once","5","10","100","5 seconds"];
var extractDiagonalModesCount=[1,5,10,100,Infinity];
function toggleExtractDiagonalMode(){
  extractDiagonalMode=(extractDiagonalMode+1)%extractDiagonalModes.length;
  dg("toggleExtractDiagonalModeButton").textContent="Mode: "+extractDiagonalModes[extractDiagonalMode];
}
var handlekey=function(e){
  setTimeout(draw,0,true);
}
