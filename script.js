var canvas;
var ctx;
var outimg;
var cursorstr="▮";
var cursorendstr="▯";
var lineBreakRegex=/\r?\n/g;
var itemSeparatorRegex=/[\t ,]/g;
window.onload=function (){
  console.clear();
  canvas=dg("output");
  ctx=canvas.getContext("2d");
  outimg=dg("outimg");
  dg('input').onkeydown=handlekey;
  dg('input').onfocus=handlekey;
  dg('input').onmousedown=handlekey;
  load();
  requestDraw(true);
  drawIntervalLoopFunc();
  setInterval(function(){if(hasRequestedDraw)processDrawRequest();},0);
}
function drawIntervalLoopFunc(){
  if (document.activeElement==document.getElementById("input")) requestDraw();
  setTimeout(drawIntervalLoopFunc,0);
}
var hasRequestedDraw=false;
var hasRequestedRecalculation=false;
var lastDrawTime=-1;
function requestDraw(recalculate){
  hasRequestedRecalculation=hasRequestedRecalculation||recalculate;
  hasRequestedDraw=true;
}
function processDrawRequest(){
  if (Date.now()-lastDrawTime<10) return;
  try{
    lastDrawTime=Date.now();
    draw(hasRequestedRecalculation);
  }catch(e){
    throw e;
  }
  hasRequestedDraw=false;
  hasRequestedRecalculation=false;
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
function calcMountain(s){
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
      if (lastLayer[i].forcedParent){
        if (lastLayer[i].parentIndex!=-1) hasNextLayer=true;
        continue;
      }
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
  if (recalculate&&inputChanged) calculatedMountains=inputc.split(lineBreakRegex).map(calcMountain);
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
  document.getElementById("outputcontainer").style.width=x+"px";
  document.getElementById("outputcontainer").style.height=y+"px";
  canvas.width=x;
  canvas.height=y;
  ctx.fillStyle="white"; //clear
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="black";
  ctx.strokeStyle="black";
  ctx.lineWidth=+LINETHICKNESS;
  ctx.font=NUMBERTHICKNESS+" "+NUMBERSIZE+"px Arial";
  ctx.textAlign="center";
  var by=0;
  for (var i=0;i<calculatedMountains.length;i++){
    var mountain=calculatedMountains[i];
    for (var j=0;j<mountain.length;j++){
      var row=mountain[j];
      for (var k=0;k<row.length;k++){
        var point=row[k];
        ctx.fillText(j==0?point.strexp:point.value,COLUMNWIDTH*(point.position*2+j+1)/2,by+ROWHEIGHT*(mountain.length-j)-3);
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
  waitAndMakeDownloadableIfInactive(++timesDrawn);
}
function waitAndMakeDownloadableIfInactive(timesDrawnThis){
  swapImageToCanvas();
  var d=document.getElementById("drawStatus");
  d.textContent="Downloadable conversion interrupted";
  setTimeout(function (){
    if (timesDrawnThis!=timesDrawn) return;
    //enable save
    if (canvas.toBlob&&Promise&&URL&&URL.createObjectURL){
      d.style.display="";
      d.textContent="Making the image downloadable"
      new Promise(function (resolve,reject){
        canvas.toBlob(resolve,"image/png");
      }).then(function (blob){
        if (timesDrawnThis!=timesDrawn) return;
        if (blob){
          URL.revokeObjectURL(outimg.src);
          outimg.src=URL.createObjectURL(blob);
          swapImageToImg();
        }
        d.style.display="none";
      });
    }else{
      d.style.display="";
      d.textContent="Making the image downloadable";
      setTimeout(function (){
        outimg.width=canvas.width;
        outimg.height=canvas.height;
        outimg.src=canvas.toDataURL("image/png");
        swapImageToImg();
        d.style.display="none";
      },0);
    }
  },1000);
}
function swapImageToCanvas(){
  var savedScrollX=window.scrollX;
  var savedScrollY=window.scrollY;
  canvas.style.display="";
  outimg.style.display="none";
  window.scroll(savedScrollX,savedScrollY);
}
function swapImageToImg(){
  var savedScrollX=window.scrollX;
  var savedScrollY=window.scrollY;
  canvas.style.display="none";
  outimg.style.display="";
  window.scroll(savedScrollX,savedScrollY);
}
window.onpopstate=function (e){
  load();
  requestDraw(true);
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
function calcDiagonal(mountain){
  var diagonal=[];
  var diagonalTree=[];
  for (var i=0;i<mountain[0].length;i++){ //only one diagonal exists for each left-side-up diagonal line
    for (var j=mountain.length-1;j>=0;j--){ //prioritize the top
      var k=0;
      while (mountain[j][k]&&mountain[j][k].position+j<i) k++;
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

//By itself -> https://naruyoko.github.io/YNySequence/
function cloneMountain(mountain){
  var newMountain=[];
  for (var i=0;i<mountain.length;i++){
    var layer=[];
    for (var j=0;j<mountain[i].length;j++){
      layer.push({
        value:mountain[i][j].value,
        position:mountain[i][j].position,
        parentIndex:mountain[i][j].parentIndex,
        forcedParent:mountain[i][j].forcedParent
      });
    }
    newMountain.push(layer);
  }
  return newMountain;
}
function getBadRoot(s){
  var mountain;
  if (typeof s=="string") mountain=calcMountain(s);
  else mountain=cloneMountain(s);
  var diagonal=calcMountain(calcDiagonal(mountain));
  if (diagonal[0][diagonal[0].length-1].value!=1){
    return getBadRoot(diagonal);
  }else{
    for (var i=mountain.length-1;i>=0;i--){
      if (mountain[i][mountain[i].length-1].position+i==mountain[0].length-1) return mountain[i-1][mountain[i-1][mountain[i-1].length-1].parentIndex].position+i-1;
    }
  }
}
function expand(s,n,stringify){
  var mountain;
  if (typeof s=="string") mountain=calcMountain(s);
  else mountain=cloneMountain(s);
  var result=cloneMountain(mountain);
  if (mountain[0][mountain[0].length-1].parentIndex==-1){
    result[0].pop();
  }else{
    var result=cloneMountain(mountain);
    var cutHeight=mountain.length-1;
    while (mountain[cutHeight][mountain[cutHeight].length-1].position+cutHeight!=mountain[0].length-1) cutHeight--;
    var actualCutHeight=cutHeight;
    var badRootSeam=getBadRoot(mountain);
    var badRootHeight;
    var diagonal=calcMountain(calcDiagonal(mountain));
    var newDiagonal;
    var yamakazi=diagonal[0][diagonal[0].length-1].value==1; //Yamakazi-Funka dualilty
    if (yamakazi){
      newDiagonal=cloneMountain(diagonal);
      newDiagonal[0].pop();
      for (var i=0;i<n;i++){
        for (var j=badRootSeam;j<mountain[0].length-1;j++){
          newDiagonal[0].push(newDiagonal[0][j]); //who cares about mountains in diagonal?
        }
      }
      cutHeight--;
      badRootHeight=cutHeight;
    }else{
      newDiagonal=expand(diagonal,n,false);
      badRootHeight=mountain.length-1;
      while (true){
        var i=0;
        while (mountain[badRootHeight][i]&&mountain[badRootHeight][i].position+badRootHeight<badRootSeam) i++;
        if (mountain[badRootHeight][i]&&mountain[badRootHeight][i].position+badRootHeight==badRootSeam) break;
        badRootHeight--;
      }
    }
    for (var i=0;i<=actualCutHeight;i++) result[i].pop(); //cut child
    if (!result[result.length-1].length) result.pop();
    var afterCutHeight=result.length;
    var afterCutMountain=cloneMountain(result);
    var afterCutLength=result[0].length;
    var badRootSeamHeight=afterCutHeight-1;
    while (true){
      var l=0;
      while (mountain[badRootSeamHeight][l]&&mountain[badRootSeamHeight][l].position+badRootSeamHeight<badRootSeam) l++;
      if (mountain[badRootSeamHeight][l]&&mountain[badRootSeamHeight][l].position+badRootSeamHeight==badRootSeam) break;
      badRootSeamHeight--;
    }
    badRootSeamHeight++;
    //Create Mt.Fuji shell
    for (var i=1;i<=n;i++){ //iteration
      for (var j=badRootSeam;j<afterCutLength;j++){ //seam
        var isAscending;
        var p=0; //simplified; may not work
        while (mountain[badRootHeight][p].position+badRootHeight<j) p++;
        if (mountain[badRootHeight][p].position+badRootHeight==j){
          while (true){
            if (!mountain[badRootHeight][p]||mountain[badRootHeight][p].position+badRootHeight<badRootSeam){
              isAscending=false;
              break;
            }
            if (mountain[badRootHeight][p].position+badRootHeight==badRootSeam){
              isAscending=true;
              break;
            }
            p=mountain[badRootHeight][p].parentIndex;
          }
        }else{
          isAscending=false;
        }
        var seamHeight=afterCutHeight-1;
        while (true){
          var l=0;
          while (mountain[seamHeight][l]&&mountain[seamHeight][l].position+seamHeight<j) l++;
          if (mountain[seamHeight][l]&&mountain[seamHeight][l].position+seamHeight==j) break;
          seamHeight--;
        }
        seamHeight++;
        var isReplacingCut=j==badRootSeam;
        //console.log([j,seamHeight]);
        if (isAscending){
          for (var k=0;k<seamHeight+(cutHeight-badRootHeight)*i;k++){
            if (!result[k]) result.push([]);
            if (k<badRootHeight){ //Bb
              var sy=k;
              var sx;
              if (isReplacingCut){
                sx=mountain[sy].length-1;
              }else{
                sx=0;
                while (mountain[sy][sx].position+sy<j) sx++;
              }
              var sourceParentIndex=mountain[sy][sx].parentIndex;
              var parentShifts=i-isReplacingCut;
              var parentPosition=mountain[sy][sourceParentIndex]?mountain[sy][sourceParentIndex].position+parentShifts*(afterCutLength-badRootSeam)*(mountain[sy][sourceParentIndex].position+sy>=badRootSeam)-(k-sy):-1;
              var parentIndex=0;
              while (result[k][parentIndex]&&result[k][parentIndex].position<parentPosition) parentIndex++;
              if (!result[k][parentIndex]||result[k][parentIndex].position!=parentPosition) parentIndex=-1;
              result[k].push({
                value:parentIndex==-1?newDiagonal[0][j+(afterCutLength-badRootSeam)*i].value:NaN,
                position:j+(afterCutLength-badRootSeam)*i-k,
                parentIndex:parentIndex,
                forcedParent:mountain[sy][sx].forcedParent
              });
            }else if (k<=badRootHeight+(cutHeight-badRootHeight)*(i-isReplacingCut)){ //Br replace
              var sy=badRootHeight;
              var sx;
              if (!yamakazi&&isReplacingCut){
                sx=mountain[sy].length-1;
              }else{
                sx=0;
                while (mountain[sy][sx].position+sy<j) sx++;
              }
              var sourceParentIndex=mountain[sy][sx].parentIndex;
              var parentShifts=i-isReplacingCut;
              var parentPosition=mountain[sy][sourceParentIndex]?mountain[sy][sourceParentIndex].position+parentShifts*(afterCutLength-badRootSeam)*(mountain[sy][sourceParentIndex].position+sy>=badRootSeam)-(k-sy):-1;
              var parentIndex=0;
              while (result[k][parentIndex]&&result[k][parentIndex].position<parentPosition) parentIndex++;
              if (!result[k][parentIndex]||result[k][parentIndex].position!=parentPosition) parentIndex=-1;
              result[k].push({
                value:parentIndex==-1?newDiagonal[0][j+(afterCutLength-badRootSeam)*i].value:NaN,
                position:j+(afterCutLength-badRootSeam)*i-k,
                parentIndex:parentIndex,
                forcedParent:mountain[sy][sx].forcedParent
              });
            }else if (isReplacingCut&&k<=badRootHeight+(cutHeight-badRootHeight)*i){ //Br extend
              var sy=k-(cutHeight-badRootHeight)*(i-1);
              var sx;
              if (!yamakazi&&isReplacingCut){
                sx=mountain[sy].length-1;
              }else{
                sx=0;
                while (mountain[sy][sx].position+sy<j) sx++;
              }
              var sourceParentIndex=mountain[sy][sx].parentIndex;
              var parentShifts=i-isReplacingCut;
              var parentPosition=mountain[sy][sourceParentIndex]?mountain[sy][sourceParentIndex].position+parentShifts*(afterCutLength-badRootSeam)*(mountain[sy][sourceParentIndex].position+sy>=badRootSeam)-(k-sy):-1;
              var parentIndex=0;
              while (result[k][parentIndex]&&result[k][parentIndex].position<parentPosition) parentIndex++;
              if (!result[k][parentIndex]||result[k][parentIndex].position!=parentPosition) parentIndex=-1;
              result[k].push({
                value:parentIndex==-1?newDiagonal[0][j+(afterCutLength-badRootSeam)*i].value:NaN,
                position:j+(afterCutLength-badRootSeam)*i-k,
                parentIndex:parentIndex,
                forcedParent:mountain[sy][sx].forcedParent
              });
            }else{ //Be
              //if (isReplacingCut) console.warn("Climbing doesn't all the way. Makes sense.");
              var sy=k-(cutHeight-badRootHeight)*i;
              var sx;
              if (!yamakazi&&isReplacingCut){
                sx=mountain[sy].length-1;
              }else{
                sx=0;
                while (mountain[sy][sx].position+sy<j) sx++;
              }
              var sourceParentIndex=mountain[sy][sx].parentIndex;
              var parentShifts=i-isReplacingCut;
              var parentPosition=mountain[sy][sourceParentIndex]?mountain[sy][sourceParentIndex].position+parentShifts*(afterCutLength-badRootSeam)*(mountain[sy][sourceParentIndex].position+sy>=badRootSeam)-(k-sy):-1;
              var parentIndex=0;
              while (result[k][parentIndex]&&result[k][parentIndex].position<parentPosition) parentIndex++;
              if (!result[k][parentIndex]||result[k][parentIndex].position!=parentPosition) parentIndex=-1;
              result[k].push({
                value:parentIndex==-1?newDiagonal[0][j+(afterCutLength-badRootSeam)*i].value:NaN,
                position:j+(afterCutLength-badRootSeam)*i-k,
                parentIndex:parentIndex,
                forcedParent:mountain[sy][sx].forcedParent
              });
            }
          }
        }else{
          if (isReplacingCut) console.warn("Cut child and not connected to bad root. Makes sense.");
          for (var k=0;k<seamHeight;k++){
            if (!result[k]) result.push([]);
            //if statement is here to line up indents
            if (true){ //Bb
              var sy=k;
              var sx;
              if (isReplacingCut){
                sx=mountain[sy].length-1;
              }else{
                sx=0;
                while (mountain[sy][sx].position+sy<j) sx++;
              }
              var sourceParentIndex=mountain[sy][sx].parentIndex;
              var parentShifts=i-isReplacingCut;
              var parentPosition=mountain[sy][sourceParentIndex]?mountain[sy][sourceParentIndex].position+parentShifts*(afterCutLength-badRootSeam)*(mountain[sy][sourceParentIndex].position+sy>=badRootSeam)-(k-sy):-1;
              var parentIndex=0;
              while (result[k][parentIndex]&&result[k][parentIndex].position<parentPosition) parentIndex++;
              if (!result[k][parentIndex]||result[k][parentIndex].position!=parentPosition) parentIndex=-1;
              result[k].push({
                value:parentIndex==-1?newDiagonal[0][j+(afterCutLength-badRootSeam)*i].value:NaN,
                position:j+(afterCutLength-badRootSeam)*i-k,
                parentIndex:parentIndex,
                forcedParent:mountain[sy][sx].forcedParent
              });
            }
          }
        }
      }
    }
  }
  //Build number from ltr, ttb
  for (var i=result.length-1;i>=0;i--){
    if (!result[i].length){
      result.pop();
      continue;
    }
    for (var j=0;j<result[i].length;j++){
      if (!isNaN(result[i][j].value)) continue;
      var k=0; //find left-up
      while (result[i+1][k].position<result[i][j].position-1) k++;
      if (result[i+1][k].position!=result[i][j].position-1) throw Error("Mountain not complete");
      result[i][j].value=result[i][result[i][j].parentIndex].value+result[i+1][k].value;
    }
  }
  var rr;
  if (stringify){
    rr=[];
    for (var i=0;result[0]&&i<result[0].length;i++){
      rr.push(result[0][i].value+(result[0].forcedParent?"v"+result[0].parentIndex:""));
    }
    rr=rr.join(",");
  }else{
    rr=result;
  }
  return rr;
}

var ontabopen={};
var tabs=["input","extractDiagonal","expandOnSite"];
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
  var lines=dg("input").value.split(lineBreakRegex);
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
  var lastSequence=dg("input").value.split(lineBreakRegex)[line];
  for (var cycles=0;cycles<extractDiagonalModesCount[extractDiagonalMode];cycles++){
    var diagonal=calcDiagonal(calcMountain(lastSequence));
    if (cycles>0){
      var lastSequenceText=lastSequence;
      if (diagonal==lastSequenceText) break;
      var lastItemOfDiagonal=parseSequenceElement(diagonal.slice(diagonal.lastIndexOf(",")+1));
      if (!(lastItemOfDiagonal.value>1)) break;
      if (!diagonal.split(",").map(parseSequenceElement).every(function(e){return isFinite(e.value)&&e.value>0;})) break;
    }
    if (extractDiagonalMode==4&&Date.now()-startTime>5000) break;
    lastSequence=diagonal;
    dg("input").value+="\r\n"+diagonal;
  }
  requestDraw(true);
  ontabopen["extractDiagonal"]();
}
var extractDiagonalMode=0;
var extractDiagonalModes=["once","5","10","100","5 seconds"];
var extractDiagonalModesCount=[1,5,10,100,Infinity];
function toggleExtractDiagonalMode(){
  extractDiagonalMode=(extractDiagonalMode+1)%extractDiagonalModes.length;
  dg("toggleExtractDiagonalModeButton").textContent="Mode: "+extractDiagonalModes[extractDiagonalMode];
}
ontabopen["expandOnSite"]=function (){
  var l=dg("expandOnSite");
  l.innerHTML="";
  var lines=dg("input").value.split(lineBreakRegex);
  for (var i in lines){
    var d=document.createElement("li");
    var e=document.createElement("u");
    e.textContent=lines[i];
    e.onclick=new Function("expandOnSite("+i+")");
    d.appendChild(e);
    l.appendChild(d);
  }
}
function expandOnSite(line){
  var sequence=dg("input").value.split(lineBreakRegex)[line];
  var n=+dg("expandOnSiteBracketInput").value;
  if (!Number.isFinite(n)||n<0) n=0;
  if (n>1000000) n=1000000;
  n=Math.floor(n);
  if (n>10&&!confirm("n specified is big. Are you sure you want to continue?\n指定されたnは大きいです。本当に実行しますか?")) return;
  var mountain=calcMountain(sequence);
  if ((mountain[0][0].value!=1||mountain[0].some(function(e){return !Number.isFinite(e.value)||!Number.isInteger(e.value)||e.value<1||!Number.isFinite(e.parentIndex)||!Number.isInteger(e.parentIndex)||e.parentIndex<-1||e.parentIndex>=mountain[0].length;}))&&!confirm("The sequence is not in domain of Y sequence. An unexpected behavior may occur. Are you sure you want to continue?\nこの数列はY数列の定義外です。本当に実行しますか?")) return;
  var diagonalLayers=0;
  var deepestDiagonal=mountain;
  while (diagonalLayers<50&&deepestDiagonal[0][deepestDiagonal[0].length-1].parentIndex!=-1){
    deepestDiagonal=calcMountain(calcDiagonal(deepestDiagonal));
    diagonalLayers++;
  }
  if (diagonalLayers>=50&&!confirm("Calculation is very complex. Are you sure you want to continue?\n計算の再帰が複雑です。本当に実行しますか?")) return;
  var expansion=expand(mountain,n,true);
  dg("input").value+="\r\n"+expansion;
  requestDraw(true);
  ontabopen["expandOnSite"]();
}
var handlekey=function(e){
  setTimeout(requestDraw,0,true);
}
