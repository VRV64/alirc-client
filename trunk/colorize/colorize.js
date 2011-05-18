window.hue2rgb = function(deg){
    /* input: 0-360 */
    var Hprim = deg/60;
    var C = 255;
    var X = Math.round((1 - Math.abs(Hprim%2 -1))*C);
    var A = (deg%5)*63;
    if(Hprim<1)
        return [C,X,A];
    if(Hprim<2)
        return [X,C,A];
    if(Hprim<3)
        return [A,C,X];
    if(Hprim<4)
        return [A,X,C];
    if(Hprim<5)
        return [X,A,C];
    if(Hprim<6)
        return [C,A,X];
}
window.str2deg = function(str){
    var cnt = 0;
    for(var i=0;i<str.length;i++){
        cnt ^= str.charCodeAt(i)*8;
    }
    return cnt%360;
}
window.colorize = function(str){
    var rgb = hue2rgb(str2deg(str));
    return "<span style='color:rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+");'>"+str+"</span>";
}
