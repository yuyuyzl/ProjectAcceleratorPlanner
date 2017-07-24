var Config={};


$(document).ready(function () {

   $("#btnGen").click(function () {
       var r=parseInt($("#inputR").val());
       Config={
           kAcceleration:parseFloat($("#inputKA").val()),
           kOverall:parseFloat($("#inputKO").val()),
           kFail:parseFloat($("#inputKF").val()),
           kStabilizer:parseFloat($("#inputKS").val()),
           kDrag:parseFloat($("#inputKD").val())

       };
       var posList=new Array();
       var arrCircle=genCircleArray(r);
       var htmlCircleTable="<table><tbody>";
       var hullCount=0;
       var tunnelCount=0;
           for(var i=0;i<r*2+5;i++){
           htmlCircleTable+="<tr>";
           for(var j=0;j<r*2+5;j++){
               switch (arrCircle[i][j]){
                   case 0:
                   case 3:
                       htmlCircleTable+="<td class='block emptyBlock'></td>";
                       break;
                   case 1:
                       htmlCircleTable+="<td class='block hullBlock'></td>";
                       hullCount++;
                       break;
                   case 2:
                       htmlCircleTable+="<td class='block tunnelBlock'></td>";
                       hullCount++;
                       hullCount++;
                       tunnelCount++;
                       posList.push([i,j]);
                       break;
               }
           }
           htmlCircleTable+="</tr>";
       }
       htmlCircleTable+="</tbody></table>";
       $("#divMain").empty().append(htmlCircleTable);
       $("#pOut").empty().append("Built with "+tunnelCount+" Tunnels and "+hullCount+" Hulls.");

       var property=calcAccProperty(posList);
       property.drag+=Config.kDrag;
       $("#pOut").append("<br>Drag = "+property.drag+"<br>Fail rate = "+property.failrate*100+"%");
       var min=1e15,minE=0;var min2=1e15,minE2=0;var n=0;
       for (var i=1;i<=32768;i+=1){
           var a=calculateAcceleration(property.drag,i, Config.kAcceleration,Config.kOverall,0,property.failrate,0);
           var a2=calculateAcceleration(property.drag,i, Config.kAcceleration,Config.kOverall,0,0,0);
           var t=100/a;
           var totEU=t*i;
           var t2=100/a2;
           var totEU2=t2*i;
           if(totEU>0 && totEU<min){
               min=totEU;
               minE=i;
           }
           if(totEU2>0 && totEU2<min2){
               min2=totEU2;
               minE2=i;
           }


       }
       var rt=property.failrate;
       while(rt>0){
           rt*=Config.kStabilizer;
           rt-=0.01;
           n++;
       }
       console.log("Best = "+min+" at "+minE+" EU/t , Best(NEED "+n+") = "+min2+" at "+minE2+" EU/t");
       $("#pOut").append("<br>Best = "+min+" at "+minE+" EU/t<br>Best(NEED "+n+") = "+min2+" at "+minE2+" EU/t");
   });
});

var genCircleArray=function (r) {
    var arrCircle=new Array(r*2+5);
    for(var i=0;i<r*2+5;i++){
        arrCircle[i]=new Array(r*2+5);
    }
    var c=r+2.5;

    for(var i=0;i<360;i+=0.0011){
        arrCircle[Math.floor(c+r*Math.sin(i))][Math.floor(c+r*Math.cos(i))]=2;
    }

    for(var i=0;i<r*2+5;i++){
        for(var j=0;j<r*2+5;j++){
            if (!arrCircle[i][j] || arrCircle[i][j]!=2){
                if((i+1<r*2+5 && arrCircle[i+1][j]==2) ||(i-1>=0 && arrCircle[i-1][j]==2) ||arrCircle[i][j+1]==2 ||arrCircle[i][j-1]==2)arrCircle[i][j]=1;else arrCircle[i][j]=0;
            }
        }
    }
    arrCircle[Math.floor(c)][Math.floor(c)]=3;
    return(arrCircle);
};

var calcAccProperty=function(posList){
    var distanceSq=function (x1,z1,x2,z2) {
        return (x1-x2)*(x1-x2)+(z1-z2)*(z1-z2)
    };
    var avgX=0,avgZ=0,avgDis=0,deltaDis=0;
    for(var i=0;i<posList.length;i++){
        avgX+=posList[i][0];
        avgZ+=posList[i][1];
    }
    avgX/=posList.length;
    avgZ/=posList.length;
    for(var i=0;i<posList.length;i++)avgDis+=Math.sqrt(distanceSq(posList[i][0],posList[i][1],avgX,avgZ));
    avgDis/=posList.length;
    //for(BlockPos p:posList)deltaDis+=Math.pow((p.distanceSq(avgX,avgY,avgZ)-avgDis-1)<0?0:(p.distanceSq(avgX,avgY,avgZ)-avgDis-1),2);
    for(var i=0;i<posList.length;i++){
        var d=Math.pow((Math.sqrt(distanceSq(posList[i][0],posList[i][1],avgX,avgZ))-avgDis),2);
        //System.out.println(String.valueOf(d));
        //d=(d-0.5<0)?0:d-0.5;
        deltaDis+=d;
    }
    deltaDis=Math.sqrt(deltaDis);
    var failrate=avgDis*avgDis*Config.kFail;
    var drag=deltaDis*1000/avgDis/posList.length/posList.length;
    //console.log(avgDis);
    //console.log(deltaDis);
    //console.log(failrate);
    //console.log(drag);
    return {failrate:failrate,drag:drag};

};

var calculateAcceleration=function(drag, eu, kAcceleration, kOverall, numStabilizer, failrate, kStabilizer){
    var r=failrate;
    //if(worldObj.getWorldTime()%20==0)System.out.println(String.valueOf(r));
    return kOverall*(kAcceleration*Math.sqrt(eu)*(1-(r>0?r:0))-drag);
}