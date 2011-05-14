window.ui = {
"titlebg":"blue",
"titlecolor":"white",
"titleheight":"20px",
"winborder":"1px black solid",
"buttonborder":"1px white solid",
"background":"#fff none",
"sepborder":"1px black solid",
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
window.winid = 1;

window.currentdrag = null;
window.dragging = false;
window.currentz = 10000;
window.dragleft = 0;
window.dragtop = 0;
window.initwinpos = 0;
window.sandbox = null

function pageLoaded(){
sandboxCont = document.createElement("div");
window.sandbox = document.createElement("div");
sandboxCont.style.position = "fixed";
sandbox.style.position = "relative";
sandbox.style.width=screen.width;
sandbox.style.height=screen.height;
sandboxCont.style.width=screen.width;
sandboxCont.style.height=screen.height;
sandbox.style.padding = "0px";
sandbox.style.margin = "0px";
sandboxCont.style.padding = "0px";
sandboxCont.style.margin = "0px";
sandboxCont.style.left = "0px";
sandboxCont.style.top = "0px";
sandbox.style.overflow="hidden";
sandboxCont.appendChild(sandbox);
document.body.appendChild(sandboxCont);
bind(sandbox,"mousemove",move);
bind(sandbox,"mouseup",stopdrag);
newchanwin("#test");
for(i=0;i<12;i++){
newchanwin("#"+i);
}
for(i=0;i<10;i++){
newuserwin("u"+i);
}
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
wincont.style.left = initwinpos+"px";
wincont.style.top = initwinpos%256+"px";
initwinpos += 18;
wincont.style.zIndex = currentz++;
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
title.style.height="18px";
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
closebutton.style.cursor = "default";
bind(closebutton,"click",deletewin);
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

sandbox.appendChild(wincont);
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
dragleft = parseInt(currentdrag.style.left)-event.clientX;
dragtop = parseInt(currentdrag.style.top)-event.clientY;
currentdrag.style.zIndex = currentz++;
dragging = true;
return false;
}
function stopdrag(event){
dragging = false;
}
function move(event){
if(!dragging) return;
currentdrag.style.left = dragleft+event.clientX+"px";
currentdrag.style.top = dragtop+event.clientY+"px";
return false;
}
function deletewin(event){
var tmp = event.target.parentNode;
if(tmp.cont) win = tmp;
else win = tmp.parentNode;
win.onclose(win)
sandbox.removeChild(win.cont);
}
function blank(){
return;
}


/** IRC Window**/

window.targetmap = {}

function newchanwin(channel){
win = winobj(channel)
channel = channel.toLowerCase()
var input = document.createElement("textarea");
var output = document.createElement("div");
var userlist = document.createElement("ul");
var usercont = document.createElement("div");
var topicdiv = document.createElement("div");
input.style.position = "absolute";
output.style.position = "absolute";
usercont.style.position = "absolute";
topicdiv.style.position = "absolute";
input.style.border = ui["sepborder"];
output.style.border = ui["sepborder"];
usercont.style.border = ui["sepborder"];
topicdiv.style.border = ui["sepborder"];
usercont.style.width = "75px";
topicdiv.style.top = "18px";
topicdiv.style.height = "18px";
output.style.top = "36px";
usercont.style.top = "36px";
input.style.width = "100%";
input.style.height = "36px";
usercont.appendChild(userlist);

win.chanstuff = {
"userlist":userlist,
"output":output,
"input":input,
"topic":topicdiv
}
win.appendChild(input);
win.appendChild(output);
win.appendChild(usercont);
win.appendChild(topicdiv);
win.onuiupdate = adjustchanui;

winsize(win,480,320);
targetmap[channel] = win;


}

function adjustchanui(win){
var listwidth = parseInt(win.chanstuff["userlist"].parentNode.style.width);
var winwidth = parseInt(win.cont.style.width);
win.chanstuff["output"].style.width = winwidth-listwidth+"px";
win.chanstuff["userlist"].parentNode.style.left = win.chanstuff["output"].style.width;
var inhigh = parseInt(win.chanstuff["input"].style.height);
var winhigh = parseInt(win.cont.style.height);
win.chanstuff["output"].style.height = winhigh-inhigh-36+"px";
win.chanstuff["input"].style.top = winhigh-inhigh+"px";
win.chanstuff["userlist"].parentNode.style.height = win.chanstuff["output"].style.height;
}

function newuserwin(username){
win = winobj(username)
username = username.toLowerCase()
var input = document.createElement("textarea");
var output = document.createElement("div");
var topicdiv = document.createElement("div");
input.style.position = "absolute";
output.style.position = "absolute";
topicdiv.style.position = "absolute";
input.style.border = ui["sepborder"];
output.style.border = ui["sepborder"];
topicdiv.style.border = ui["sepborder"];
topicdiv.style.top = "18px";
topicdiv.style.height = "18px";
output.style.top = "36px";
output.style.width = "100%";
input.style.width = "100%";
input.style.height = "36px";

win.chanstuff = {
"output":output,
"input":input,
"topic":topicdiv
}
win.appendChild(input);
win.appendChild(output);
win.appendChild(topicdiv);
win.onuiupdate = adjustuserui;

winsize(win,270,320);
targetmap[username] = win;


}
function adjustuserui(win){
var inhigh = parseInt(win.chanstuff["input"].style.height);
var winhigh = parseInt(win.cont.style.height);
win.chanstuff["output"].style.height = winhigh-inhigh-36+"px";
win.chanstuff["input"].style.top = winhigh-inhigh+"px";
}

