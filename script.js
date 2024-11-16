var canvas;
var ctx;
var outimg;
var cursorstr="▮";
var cursorendstr="▯";
var lineBreakRegex=/\r?\n/g;
var itemSeparatorRegex=/[\t ,]/g;
window.onload=function (){
  console.clear();
  canvas=document.getElementById("output");
  ctx=canvas.getContext("2d");
  outimg=document.getElementById("outimg");
  document.getElementById('input').onkeydown=handlekey;
  document.getElementById('input').onfocus=handlekey;
  document.getElementById('input').onmousedown=handlekey;
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
function parseSequenceString(s){
  return s.split(itemSeparatorRegex).map(parseSequenceElement);
}
function calcMountain(s){
  var lastLayer;
  if (typeof s=="string") lastLayer=parseSequenceString(s);
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
function updateMountainString(inputc){
  for (var lines=inputc.split(lineBreakRegex),i=0;i<lines.length;i++){
    for (var nums=lines[i].split(itemSeparatorRegex),j=0;j<nums.length;j++){
      calculatedMountains[i][0][j].strexp=getstrexp(nums[j]);
    }
  }
}
var options=["input","ROWHEIGHT","COLUMNWIDTH","LINETHICKNESS","NUMBERSIZE","NUMBERTHICKNESS","LINEPLACE"];
var config={
  "input":"",
  "inputc":"",
  "ROWHEIGHT":0,
  "COLUMNWIDTH":0,
  "LINETHICKNESS":0,
  "NUMBERSIZE":0,
  "NUMBERTHICKNESS":0,
  "LINEPLACE":0,
};
var displayedConfig=Object.assign({},config);
var inputFocused=false;
var timesDrawn=0;
function draw(recalculate){
  var newConfig=Object.assign({},config);
  for (var i=0;i<options.length;i++){
    var optionName=options[i];
    var newValue;
    var elem=document.getElementById(optionName);
    if (elem.type=="number") newValue=+elem.value;
    else if (elem.type=="text"||optionName=="input") newValue=elem.value;
    else if (elem.type=="range") newValue=+elem.value;
    else if (elem.type=="checkbox") newValue=elem.checked;
    if (config[optionName]!=newValue){
      newConfig[optionName]=newValue;
      recalculate=true;
    }
    if (displayedConfig[optionName]!=newValue){
      displayedConfig[optionName]=newValue;
      if (elem.type=="range") document.getElementById(optionName+"_value").textContent=newValue+"";
    }
  }
  var sequenceInputElem=document.getElementById("input");
  var cursorPos=sequenceInputElem.selectionStart;
  var cursorEndPos=sequenceInputElem.selectionEnd;
  if (!inputFocused){
    newConfig["inputc"]=newConfig["input"];
  }else{
    if (cursorPos==cursorEndPos){
      newConfig["inputc"]=newConfig["input"].substring(0,cursorPos)+cursorstr+newConfig["input"].substring(cursorPos);
    }else{
      newConfig["inputc"]=newConfig["input"].substring(0,cursorPos)+cursorstr+newConfig["input"].substring(cursorPos,cursorEndPos)+cursorendstr+newConfig["input"].substring(cursorEndPos);
    }
  }
  if (config["inputc"]!=newConfig["inputc"]) recalculate=true;
  if (!recalculate) return;
  if (config["input"]!=newConfig["input"]) calculatedMountains=newConfig["inputc"].split(lineBreakRegex).map(calcMountain);
  else updateMountainString(newConfig["inputc"]);
  //get image size
  var x=0;
  var y=0;
  for (var i=0;i<calculatedMountains.length;i++){
    var mountain=calculatedMountains[i];
    x=Math.max(x,mountain[0].length*newConfig["COLUMNWIDTH"]);
    y+=mountain.length*newConfig["ROWHEIGHT"];
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
  ctx.lineWidth=+newConfig["LINETHICKNESS"];
  ctx.font=newConfig["NUMBERTHICKNESS"]+" "+newConfig["NUMBERSIZE"]+"px Arial";
  ctx.textAlign="center";
  var by=0;
  for (var i=0;i<calculatedMountains.length;i++){
    var mountain=calculatedMountains[i];
    for (var j=0;j<mountain.length;j++){
      var row=mountain[j];
      for (var k=0;k<row.length;k++){
        var point=row[k];
        ctx.fillText(j==0?point.strexp:point.value,newConfig["COLUMNWIDTH"]*(point.position*2+j+1)/2,by+newConfig["ROWHEIGHT"]*(mountain.length-j)-3);
        if (j>0){
          ctx.beginPath();
          ctx.moveTo(newConfig["COLUMNWIDTH"]*(point.position*2+j+2)/2,by+newConfig["ROWHEIGHT"]*(mountain.length-j+1)-newConfig["NUMBERSIZE"]*Math.min(newConfig["LINEPLACE"],1)-(newConfig["ROWHEIGHT"]-newConfig["NUMBERSIZE"])*Math.max(newConfig["LINEPLACE"]-1,0)-3);
          ctx.lineTo(newConfig["COLUMNWIDTH"]*(point.position*2+j+1)/2,by+newConfig["ROWHEIGHT"]*(mountain.length-j));
          var l=0;
          while (mountain[j-1][l].position!=point.position+1) l++;
          ctx.lineTo(newConfig["COLUMNWIDTH"]*(mountain[j-1][mountain[j-1][l].parentIndex].position*2+j)/2,by+newConfig["ROWHEIGHT"]*(mountain.length-j+1)-newConfig["NUMBERSIZE"]*Math.min(newConfig["LINEPLACE"],1)-(newConfig["ROWHEIGHT"]-newConfig["NUMBERSIZE"])*Math.max(newConfig["LINEPLACE"]-1,0)-3);
          ctx.stroke();
        }
      }
    }
    by+=mountain.length*newConfig["ROWHEIGHT"];
  }
  waitAndMakeDownloadableIfInactive(++timesDrawn);
  Object.assign(config,newConfig);
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
    document.getElementById(i+"Tab").style.display="none";
  }
  document.getElementById(name+"Tab").style.display="";
  if (ontabopen[name] instanceof Function) ontabopen[name]();
}
ontabopen["extractDiagonal"]=function (){
  var l=document.getElementById("extractDiagonal");
  l.innerHTML="";
  var lines=document.getElementById("input").value.split(lineBreakRegex);
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
  var lastSequence=document.getElementById("input").value.split(lineBreakRegex)[line];
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
    document.getElementById("input").value+="\r\n"+diagonal;
  }
  requestDraw(true);
  ontabopen["extractDiagonal"]();
}
var extractDiagonalMode=0;
var extractDiagonalModes=["once","5","10","100","5 seconds"];
var extractDiagonalModesCount=[1,5,10,100,Infinity];
function toggleExtractDiagonalMode(){
  extractDiagonalMode=(extractDiagonalMode+1)%extractDiagonalModes.length;
  document.getElementById("toggleExtractDiagonalModeButton").textContent="Mode: "+extractDiagonalModes[extractDiagonalMode];
}
ontabopen["expandOnSite"]=function (){
  var l=document.getElementById("expandOnSite");
  l.innerHTML="";
  var lines=document.getElementById("input").value.split(lineBreakRegex);
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
  var sequence=document.getElementById("input").value.split(lineBreakRegex)[line];
  var n=+document.getElementById("expandOnSiteBracketInput").value;
  if (!Number.isFinite(n)||n<0) n=0;
  if (n>1000000) n=1000000;
  n=Math.floor(n);
  if (n>10&&!confirm("n is big. Are you sure you want to continue?\n大きなnが指定されました。本当に実行しますか?")) return;
  var mountain=calcMountain(sequence);
  if ((mountain[0][0].value!=1||mountain[0].some(function(e){return !Number.isFinite(e.value)||!Number.isInteger(e.value)||e.value<1||!Number.isFinite(e.parentIndex)||!Number.isInteger(e.parentIndex)||e.parentIndex<-1||e.parentIndex>=mountain[0].length;}))&&!confirm("The sequence is not in domain of Y sequence. An unexpected behavior may occur. Are you sure you want to continue?\nこの数列はY数列の定義域外です。本当に実行しますか?")) return;
  var diagonalLayers=0;
  var deepestDiagonal=mountain;
  while (diagonalLayers<50&&deepestDiagonal[0][deepestDiagonal[0].length-1].parentIndex!=-1){
    deepestDiagonal=calcMountain(calcDiagonal(deepestDiagonal));
    diagonalLayers++;
  }
  if (diagonalLayers>=50&&!confirm("Calculation is very complex. Are you sure you want to continue?\n計算が複雑です。本当に実行しますか?")) return;
  var expansion=expand(mountain,n,true);
  document.getElementById("input").value+="\r\n"+expansion;
  requestDraw(true);
  ontabopen["expandOnSite"]();
}


window.onpopstate=function (e){
  load();
  requestDraw(true);
}
function saveSimple(clipboard){
  var lines=config["input"].split(lineBreakRegex);
  var encodedInput="";
  for (var i=0;i<lines.length;i++){
    var parsed=parseSequenceString(lines[i]);
    for (var j=0;j<parsed.length;j++){
      encodedInput+=parsed[j].forcedParent?parsed[j].value+"v"+parsed[j].parentIndex:parsed[j].value;
      if (j<parsed.length-1) encodedInput+=",";
    }
    if (i<lines.length-1) encodedInput+=";";
  }
  history.pushState(null,"",location.origin+location.pathname+"#"+encodedInput);
  if (clipboard) copyLocationToClipboard();
}
function saveDetailed(clipboard){
  var state={};
  for (var i=0;i<options.length;i++){
    var optionName=options[i];
    state[optionName]=config[optionName];
  }
  var encodedState=btoa(JSON.stringify(state)).replace(/\+/g,"-").replace(/\//g,"_").replace(/\=/g,"");
  history.pushState(null,"",location.origin+location.pathname+"#"+encodedState);
  if (clipboard) copyLocationToClipboard();
}
function copyLocationToClipboard(){
  var copyarea=document.getElementById("copyarea");
  copyarea.value=location.href;
  copyarea.style.display="";
  copyarea.select();
  copyarea.setSelectionRange(0,location.href.length);
  document.execCommand("copy");
  copyarea.style.display="none";
}
function load(){
  if (location.search) location.replace(location.origin+location.pathname+"#"+(location.hash||location.search).substring(1));
  var encodedState=location.hash.substring(1);
  if (!encodedState) return;
  try{
    var state=encodedState.replace(/\-/g,"+").replace(/_/g,"/");
    if (state.length%4) state+="=".repeat(4-state.length%4);
    state=JSON.parse(atob(state));
  }catch (e){ //simple
    var input=encodedState.replace(/;/g,"\r\n");
    document.getElementById("input").value=input;
  }finally{ //detailed
    if (state instanceof Object){
      console.log(state);
      for (var i=0;i<options.length;i++){
        var optionName=options[i];
        if (state.hasOwnProperty(optionName)){
          var elem=document.getElementById(optionName);
          if (elem.type=="number") elem.value=state[optionName];
          else if (elem.type=="text"||optionName=="input") elem.value=state[optionName];
          else if (elem.type=="range") elem.value=state[optionName];
          else if (elem.type=="checkbox") elem.checked=state[optionName];
        }
      }
    }
  }
}

var handlekey=function(e){
  setTimeout(requestDraw,0,true);
}
