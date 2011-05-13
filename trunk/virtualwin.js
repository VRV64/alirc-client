ui = {
"titlebg":"blue",
"titlecolor":"white",
"titleheight":"20px",
"winborder":"1px black solid",
"buttonborder":"1px white solid",
"background":"#fff none"
}

/*
http://dromaeo.com/?id=140026

http://dromaeo.com/?dom
http://dromaeo.com/?id=140027
http://dromaeo.com/?id=140028
http://dromaeo.com/?id=140029

chrome = 500% faster than ffox with DOM
chromium = 20% faster than chrome
*/
winid = 1;

currentdrag = null;
dragging = false;

function pageLoaded(){
winobj("Hello World");
bind(document.body,"mousemove",move);
bind(document.body,"mouseup",stopdrag);
}
window.onload = pageLoaded;

function bind(element,event,method){
if(element.addEventListener)
	element.addEventListener(event,method,false);
else
	element.attachEvent("on"+event,method);
}
function winobj(titletext){
var wincont = document.createElement("div");
wincont.style.width = "200px";
wincont.style.height= "300px";
wincont.style.border = ui["winborder"];
wincont.style.position = "absolute";
var win = document.createElement("div");
win.style.padding = "0px";
win.style.margin = "0px";
win.style.height= "100%";
win.style.width = "100%";
win.style.position = "relative";
win.style.background = ui["background"];
wincont.appendChild(win);
var title = document.createElement("div");
title.style.backgroundColor = ui["titlebg"];
title.style.color = ui["titlecolor"];
title.style.left="0px";
title.style.top="0px";
title.style.position="absolute";
title.style.cursor = "move";
titlespan = document.createElement("span");
titlespan.innerHTML = titletext;
title.appendChild(titlespan);
bind(title,"mousedown",startdrag);
var closebutton = document.createElement("div");
closebutton.innerHTML = "X";
closebutton.style.left="0px";
closebutton.style.top="0px";
closebutton.style.position="absolute";
closebutton.style.border = ui["buttonborder"];
title.appendChild(closebutton);
win.appendChild(title);
win.id = "vwin"+winid;
win.closebutton = closebutton;
win.titlediv = title;
win.cont = wincont;
win.onclose = blank;
win.onuiupdate = blank;
winid++;

adjustui(win);

document.body.appendChild(wincont);
return win;
}

function adjustui(win){
win.titlediv.style.width = win.style.width;
win.closebutton.style.left = parseInt(win.cont.style.width)-15+"px";
win.onuiupdate(win);
}

function winsize(win,width,height){
win.cont.style.height = height+"px";
win.cont.style.width = width+"px";
adjustui(win);
}

function startdrag(event){
var tmp = event.target.parentNode;
if(tmp.cont) currentdrag = tmp.cont;
else currentdrag = tmp.parentNode.cont;
dragging = true;
}
function stopdrag(event){
dragging = false;
}
function move(event){
if(!dragging) return;
currentdrag.style.left = event.clientX+"px";
currentdrag.style.top = event.clientY+"px";
return false;
}

function blank(){
return;
}


/** IRC **/

window.channelmap = {}

function newchanwin(channel){
win = winobj(channel)
channel = channel.toLowerCase()
var input = document.createElement("textarea");
var output = document.createElement("div");
var userlist = document.createElement("ul");
var usercont = document.createElement("div");
var titlediv = document.createElement("div");
input.style.position = "absolute";
output.style.position = "absolute";
usercont.style.position = "absolute";
titlediv.style.position = "absolute";
userlist.style.width = "75px";

win.appendChild(input);
win.appendChild(output);
win.appendChild(usercont);
win.appendChild(titlediv);
win.onuiupdate = adjustchanui;

winsize(win,400,300);
channelmap[channel] = win;


}

function adjustchanui(win){

}
