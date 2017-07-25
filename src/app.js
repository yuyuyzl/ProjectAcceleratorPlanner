var Config={};
var readConfig=function () {
    Config = {
        kAcceleration: parseFloat($("#inputKA").val()),
        kOverall: parseFloat($("#inputKO").val()),
        kFail: parseFloat($("#inputKF").val()),
        kStabilizer: parseFloat($("#inputKS").val()),
        kDrag: parseFloat($("#inputKD").val())

    };
};

$(document).ready(function () {

    $("#btnGen").click(function () {
        var r = parseInt($("#inputR").val());
        readConfig();
        var arrCircle = genCircleArray(r);
        var htmlCircleTable = "<table cellspacing='0' border='1px'><tbody>";
        var hullCount = 0;
        var tunnelCount = 0;
        var data1=calculateMinEnergy(r,arrCircle,0);
        var min=data1.min,minE=data1.minE,property=data1.property;
        var data2=calculateMinEnergy(r,arrCircle,-1);
        var min2=data2.min,minE2=data2.minE;

        for (var i = 0; i < r * 2 + 5; i++) {
            htmlCircleTable += "<tr>";
            for (var j = 0; j < r * 2 + 5; j++) {
                switch (arrCircle[i][j]) {
                    case 0:
                    case 3:
                        htmlCircleTable += "<td class='block emptyBlock'></td>";
                        break;
                    case 1:
                        htmlCircleTable += "<td class='block hullBlock'></td>";
                        hullCount++;
                        break;
                    case 2:
                        htmlCircleTable += "<td class='block tunnelBlock'></td>";
                        hullCount++;
                        hullCount++;
                        tunnelCount++;
                        break;
                }
            }
            htmlCircleTable += "</tr>";
        }
        htmlCircleTable += "</tbody></table>";

        $("#divMain").empty().append(htmlCircleTable);
        $("#pOut").empty().append("Built with " + tunnelCount + " Tunnels and " + hullCount + " Hulls.");

        $("#pOut").append("<br>Drag = " + property.drag + "<br>Fail rate = " + property.failrate * 100 + "%");
        $("#pOut").append("<br>Best = " + min + " at " + minE + " EU/t<br>Best(0 Fail) = " + min2 + " at " + minE2 + " EU/t");
    });

    $("#btnAna").click(function () {

        readConfig();
        var htmlOutput="<table class='analyzeTable' cellspacing='0' border='1px' width='70%'><tr><th>Radius</th><th>Min Energy</th><th>Min EU/t</th><th>Min Energy(0%)</th><th>Min EU/t(0%)</th></tr>";
        for (var r=2;r<32;r++) {
            var arrCircle = genCircleArray(r);
            var data1 = calculateMinEnergy(r, arrCircle, 0);
            var data2 = calculateMinEnergy(r, arrCircle, -1);
            htmlOutput+="<tr><td>"+r+"</td><td>"+(data1.min==1e15?"Impossible":data1.min)+"</td><td>"+data1.minE+"</td><td>"+(data2.min==1e15?"Impossible":data2.min)+"</td><td>"+data2.minE+"</td></tr>";
        }
        htmlOutput+="</table>";
        $("#divMain").empty().append(htmlOutput);
    })
});

var genCircleArray=function (r) {
    var arrCircle = new Array(r * 2 + 5);
    for (var i = 0; i < r * 2 + 5; i++) {
        arrCircle[i] = new Array(r * 2 + 5);
    }
    var c = r + 2.5;
    /*
    for (var i = 0; i < 360; i += 0.0011) {
        arrCircle[Math.floor(c + r * Math.sin(i))][Math.floor(c + r * Math.cos(i))] = 2;
    }*/

    var px=2,py=r+2;
    var modified=0;
    var dirOffset=[[1,0],[0,1],[-1,0],[0,-1]];
    var dirfrom=0;
    //console.log("---------------");
    for(var t=0;t<r*8;t++){
        //console.log(px+" "+py);
        arrCircle[px][py]=2;
        var mindir=-1,mindis=1e15;
        for(var ii=dirfrom+3;ii<dirfrom+3+4;ii++){
            var i=ii%4;
            if(px+dirOffset[i][0]<0)continue;
            if(px+dirOffset[i][0]>=r*2+5)continue;
            if(py+dirOffset[i][1]<0)continue;
            if(py+dirOffset[i][1]>=r*2+5)continue;
            if (arrCircle[px+dirOffset[i][0]][py+dirOffset[i][1]]==2)continue;
            var dis=Math.abs(Math.pow(px+dirOffset[i][0]+0.5-c,2)+Math.pow(py+dirOffset[i][1]+0.5-c,2)-r*r);
            if(mindis>dis){
                mindis=dis;
                mindir=i;
            }
        }
        px+=dirOffset[mindir][0];
        py+=dirOffset[mindir][1];
        modified++;
        dirfrom=mindir;
    }



    for (var i = 0; i < r * 2 + 5; i++) {
        //var s="";
        for (var j = 0; j < r * 2 + 5; j++) {
            //s+=Math.abs(Math.pow(i+0.5-c,2)+Math.pow(j+0.5-c,2)-r*r)+"\t";
            if (!arrCircle[i][j] || arrCircle[i][j] != 2) {
                if ((i + 1 < r * 2 + 5 && arrCircle[i + 1][j] == 2) || (i - 1 >= 0 && arrCircle[i - 1][j] == 2) || arrCircle[i][j + 1] == 2 || arrCircle[i][j - 1] == 2) arrCircle[i][j] = 1; else arrCircle[i][j] = 0;
            }
        }
        //console.log(s);
    }
    arrCircle[Math.floor(c)][Math.floor(c)] = 3;
    return (arrCircle);
};

var calcAccProperty=function(posList) {
    var distanceSq = function (x1, z1, x2, z2) {
        return (x1 - x2) * (x1 - x2) + (z1 - z2) * (z1 - z2)
    };
    var avgX = 0, avgZ = 0, avgDis = 0, deltaDis = 0;
    for (var i = 0; i < posList.length; i++) {
        avgX += posList[i][0];
        avgZ += posList[i][1];
    }
    avgX /= posList.length;
    avgZ /= posList.length;
    for (var i = 0; i < posList.length; i++) avgDis += Math.sqrt(distanceSq(posList[i][0], posList[i][1], avgX, avgZ));
    avgDis /= posList.length;
    //for(BlockPos p:posList)deltaDis+=Math.pow((p.distanceSq(avgX,avgY,avgZ)-avgDis-1)<0?0:(p.distanceSq(avgX,avgY,avgZ)-avgDis-1),2);
    for (var i = 0; i < posList.length; i++) {
        var d = Math.pow((Math.sqrt(distanceSq(posList[i][0], posList[i][1], avgX, avgZ)) - avgDis), 2);
        //System.out.println(String.valueOf(d));
        //d=(d-0.5<0)?0:d-0.5;
        deltaDis += d;
    }
    deltaDis = Math.sqrt(deltaDis);
    var failrate = avgDis * avgDis * Config.kFail;
    var drag = deltaDis * 1000 / avgDis / posList.length / posList.length;
    //console.log(avgDis);
    //console.log(deltaDis);
    //console.log(failrate);
    //console.log(drag);
    return {failrate: failrate, drag: drag};

};

var calculateAcceleration=function(drag, eu, kAcceleration, kOverall, numStabilizer, failrate, kStabilizer) {
    var r = failrate;
    //if(worldObj.getWorldTime()%20==0)System.out.println(String.valueOf(r));
    return kOverall * (kAcceleration * Math.sqrt(eu) * (1 - (r > 0 ? r : 0)) - drag);
};

var calculateMinEnergy=function (r,arrCircle,stabNum) {
    var posList=new Array();
    for (var i = 0; i < r * 2 + 5; i++)
        for (var j = 0; j < r * 2 + 5; j++)
            if(arrCircle[i][j]==2)
                posList.push([i, j]);
    var property = calcAccProperty(posList);
    property.drag += Config.kDrag;

    var min = 1e15, minE = 0;

    rt=property.failrate;
    for(var j=0;j<stabNum;j++){
        rt *= Config.kStabilizer;
        rt -= 0.01;
        n++;
    }
    if (rt<0)rt=0;
    if(stabNum<0)rt=0;

    var getans=function (i) {

        var a = calculateAcceleration(property.drag, i, Config.kAcceleration, Config.kOverall, 0, rt, 0);
        //var a2 = calculateAcceleration(property.drag, i, Config.kAcceleration, Config.kOverall, 0, 0, 0);
        var t = 100 / a;
        var totEU = t * i;
        totEU=Math.round(totEU);
        return totEU>0?totEU:1e15;
    };

    var triSearch=function (l,r) {
        if(r-l<0.1){
            return{minE:Math.round(l),min:getans(l)}
        }
        var mid=l+r;
        mid/=2;
        var midmid=mid+r;
        midmid/=2;
        var midans=getans(mid);
        var midmidans=getans(midmid);
        if (midmidans<midans)return triSearch(mid,r);
        else return triSearch(l,midmid);

    };
    var a=triSearch(1,1000000);
    return {property:property,min:a.min,minE:a.minE};
};