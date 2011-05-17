window.hue2rgb = function(deg){
    /* input: 0-255 */
    var Hprim = deg/60;
    var C = 255;
    var X = Math.round((1 - Math.abs(Hprim%2 -1))*C);
    if(Hprim<1)
        return [C,X,0];
    if(Hprim<2)
        return [X,C,0];
    if(Hprim<3)
        return [0,C,X];
    if(Hprim<4)
        return [0,X,C];
    if(Hprim<5)
        return [X,0,C];
    if(Hprim<6)
        return [C,0,X];
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
