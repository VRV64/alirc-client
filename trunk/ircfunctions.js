function raw(data){
	socket.irc.send(data);
	return true;
}
function ircstartup(){
irc["nick"] = document.getElementById("nick").value;
raw("USER "+irc["nick"]+" 8 0 :"+irc["nick"]);
raw("NICK "+irc["nick"]);
}
function sendCommand(data){
raw(data);
}
function ircdata(data){
	if(data.substr(0,4)=="PING"){
		return raw("PO".concat(data.substring(2)));
	}
	var chunks = data.split(":");
	var params = chunks[1].split(" ");
	var message = chunks.slice(2).join(":");
	var cmd = params[1];
	var userhost = params[0].split(/(.+)!(.+)@(.+)/).slice(1,3);
	if(!userhost.length) userhost = [params[0], "", params[0]];
	switch(cmd){
        case "JOIN":
            if(isMe(userhost[0])){
                raw("MODE "+message);
            } else{
                var chan = gettarget(message);
                chan.chanstuff.users.push([userhost[0],""]);
                updateUsers(chan);
                addMessage(message,colorize(userhost[0])+" has joined "+message);
            }
        break;
        case "NOTICE":
            addMessage(currentwin.win.chanstuff["input"].sendto,colorize(userhost[0])+" (=>"+params[2]+"<=): "+message);
        break;
        case "PRIVMSG":
            if(isMe(params[2])){
                addMessage(userhost[0],colorize(userhost[0])+": "+message);
                gettarget(userhost[0]).chanstuff["userhost"].innerHTML = params[0];
            }else{
                addMessage(params[2],colorize(userhost[0])+": "+message);
            }
        break;
        case "PART":
            var reason = "";
            if(message) reason = " ("+message+")";
            if(isMe(userhost[0])){
                var chan = gettarget(params[2]);
                addMessage(params[2],"You have left "+params[2]+reason);
                addMessage(params[2],"<hr>");
            } else {
                var chan = gettarget(params[2]);
                removeUser(chan,userhost[0]);
                updateUsers(chan);
                addMessage(params[2],colorize(userhost[0])+" has left "+params[2]+reason);
            }
        break;
		/* Show message, nothing else */
		case "251"://lusers
		case "255":
		case "265":
		case "266":
		case "372"://motd
		case "375":
			addMessage(irc.server,message);
		break;
		/* Show nothing at all */
		case "001":
		case "002":
		case "003":/* 001-004 can't be used because irc.server doesn't exist yet :( */
		case "004":
        case "366"://end names
		case "376"://end motd
		break;
		case "005":
            for(var p in params){
                keyval = params[p].split("=");
                switch(keyval[0]){
                    case 'CHANMODES':
                        irc.chmodegrps = keyval[1].split(",");
                    break;
                    case 'STATUSMSG':
                        irc.chstatus = keyval[1];
                        irc.chstatusreg = new RegExp("(["+irc.chstatus+"]*)(.+)")
                    break;
                    case 'NAMESX':
                        raw("protoctl namesx");// /names will send all statuses
                    break;
                    case 'NETWORK':
                        irc.server = keyval[1];                        
                    break;
                }
            }
        break;
		/* Param[2] + message */
		case "252":
		case "254":
			addMessage(irc.server,param[2].concat(" ",message));
		break;
        case "324"://mode [chmode list]
            var chan = gettarget(params[3]);
            chan.chanstuff.mode.innerHTML = "["+params[4]+"] ";
        break;
        case "329"://topic setter
            var chan = gettarget(params[3]);
            var d = new Date(parseInt(params[4])*1000);
            chan.chanstuff.topic.parentNode.setAttribute("title","Mode changed on "+d.toLocaleString());
        break;
        case "332"://topic
            var chan = gettarget(params[3]);
            chan.chanstuff.topic.innerHTML = message;
        break;
        case "333"://topic setter
            var chan = gettarget(params[3]);
            var d = new Date(parseInt(params[5])*1000);
            chan.chanstuff.topic.parentNode.setAttribute("title","Topic set by "+params[4]+" on "+d.toLocaleString());
        break;
        case "353"://names
            var chan = gettarget(params[4]);
            var n = null;
            var s = message.split(" ");
            for(var u in s){
                n = s[u].match(irc.chstatusreg);
                if(!n) continue;
                if(!in_users(n[2],chan.chanstuff.users))
                    chan.chanstuff.users.push([n[2],n[1]]);
            }
            updateUsers(chan);//chanstuff.users.sort(userSort);
        break;
		default:
			addMessage(userhost[0],params.slice(1).join(" ").concat(": ",message));
		break;
	}
}
window.isMe = function(nick){
if(nick.toLowerCase()==irc['nick'].toLowerCase()) return true;
return false;
}
function addMessage(nam,html){
    var p = document.createElement("p");
    var d = new Date();
    p.innerHTML = "[".concat(timepad(d.getHours()),":",timepad(d.getMinutes()),"] ",html);
    p.style.margin = "0px";
    p.style.fontSize = "12px";
    var target = gettarget(nam);
    var output = target.chanstuff["output"];
    var willScroll = (output.clientHeight+output.scrollTop >= output.scrollHeight);
    output.appendChild(p);
    if(willScroll) output.scrollTop = output.scrollHeight-output.clientHeight;
    if(currentwin!=target.cont){
        if(!target.msgs.innerHTML) target.msgs.innerHTML = "(1)";
        else target.msgs.innerHTML = "("+(parseInt(target.msgs.innerHTML.substring(1))+1)+")";
    }
    if(!pagefocused){
        if(document.title.substring(0,5)!="IRC ("){
            document.title = "IRC (1) "+document.title;
        } else {
            var dt = document.title.match(/IRC \((\d*)\) (.*)/);
            document.title = "IRC ("+ (parseInt(dt[1])+1) +") "+dt[2];
        }
    }
    return;
    //box = focusChat(name);
    var output = document.getElementById("msg");
    var willScroll = (output.clientHeight+output.scrollTop >= output.scrollHeight);
    output.appendChild(p);
    if(willScroll) output.scrollTop = output.scrollHeight-output.clientHeight;
    /*return p;*/
}
function irc2html(irctext){
return irctext;
}
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
        cnt ^= str.charCodeAt(i);
    }
    return (cnt*8)%360;
}
window.colorize = function(str){
    var rgb = hue2rgb(str2deg(str));
    return "<span style='color:rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+");'>"+str+"</span>";
}

function trimstatus(str) {
	for (var i = 0; i < str.length; i++) {
		if (irc["chstatus"].indexOf(str.charAt(i)) === -1) {
			str = str.substring(i);
			break;
		}
	}
	return str;
}
function in_users(needle,haystack){
    needle = needle.toLowerCase();
    for(var key in haystack){
        if(haystack[key][0].toLowerCase()==needle) return true;
    }
    return false;
}
window.removeUser = function(chan,user){
    user = user.toLowerCase();
    for(var u in chan.chanstuff.users){
        if(chan.chanstuff.users[u][0].toLowerCase()==user){
            chan.chanstuff.users.splice(u,1);
            return true;
        }
    }
    return false;    
}
window.timepad = function(number) {
    return (number < 10) ? '0'+number : number;
}









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

window.currentwin = null;
window.dragging = false;
window.currentz = 10000;
window.dragleft = 0;
window.dragtop = 0;
window.initwinpos = 0;
window.sandbox = null;
window.pagefocused = true;

window.pageLoaded = function(){
sandboxCont = document.createElement("div");
window.sandbox = document.createElement("div");
sandboxCont.style.position = "fixed";
sandbox.style.position = "relative";
sandbox.style.width="1px";
sandbox.style.height="1px";
sandboxCont.style.width="1px";
sandboxCont.style.height="1px";
sandboxCont.style.left = "0px";
sandboxCont.style.top = "0px";
sandboxCont.appendChild(sandbox);
document.body.appendChild(sandboxCont);
bind(document.body,"mousemove",move);
bind(document.body,"mouseup",stopdrag);
/*newchanwin("#test");
for(i=0;i<12;i++){
newchanwin("#"+i);
}
for(i=0;i<10;i++){
newuserwin("u"+i);
}*/
}
//window.onload = pageLoaded;

window.bind = function(element,event,method){
if(element.addEventListener)
	element.addEventListener(event,method,false);
else
	element.attachEvent("on"+event,method);
}
window.winobj = function(titletext){
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
titlemsg = document.createElement("span");
title.appendChild(titlemsg);
titlespan = document.createElement("span");
titlespan.innerHTML = titletext;
title.appendChild(titlespan);
bind(title,"mousedown",startdrag);
bind(wincont,"mousedown",wintotop);
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
win.msgs = titlemsg;
wincont.win = win;//reversable binding
win.cont = wincont;
win.onclose = blank;
win.onuiupdate = blank;
winid++;

adjustui(win);

sandbox.appendChild(wincont);
currentwin = wincont;
return win;
}

window.adjustui = function(win){
win.titlediv.style.width = win.style.width;
win.closebutton.style.left = parseInt(win.cont.style.width)-15+"px";
win.onuiupdate(win);
}

window.winsize = function(win,width,height){
win.cont.style.height = height+"px";
win.cont.style.width = width+"px";
adjustui(win);
}

window.startdrag = function(event){
var tmp = event.target.parentNode;
if(tmp.cont) currentwin = tmp.cont;
else currentwin = tmp.parentNode.cont;
dragleft = parseInt(currentwin.style.left)-event.clientX;
dragtop = parseInt(currentwin.style.top)-event.clientY;
//currentwin.style.zIndex = currentz++;
dragging = true;
document.body.focus();
document.onselectstart = blank;
return false;
}
window.stopdrag = function(event){
if(!dragging) return;
dragging = false;
document.onselectstart = null;
if(currentwin.win.chanstuff) currentwin.win.chanstuff.input.focus();
}
window.move = function(event){
if(!dragging) return;
currentwin.style.left = dragleft+event.clientX+"px";
currentwin.style.top = dragtop+event.clientY+"px";
return false;
}
window.deletewin = function(event){
var tmp = event.target.parentNode;
if(tmp.cont) win = tmp;
else win = tmp.parentNode;
win.onclose(win)
sandbox.removeChild(win.cont);
if(targetmap[win.chanstuff.input.sendto]) delete targetmap[win.chanstuff.input.sendto];
delete win;
}
window.blank = function(){
return false;
}
window.wintotop = function(event){
var tmp = event.target;
if(!tmp) return;
for(i=0;i<40;i++){
    if (tmp.cont){tmp.cont.style.zIndex = currentz++; currentwin = tmp.cont; clearMsgs(currentwin.win); return;}
    else tmp = tmp.parentNode;
    }
}
window.clearMsgs = function(win){
    win.msgs.innerHTML = "";
}


/** IRC Window**/

window.targetmap = {}

window.newchanwin = function(channel){
win = winobj(channel)
channel = channel.toLowerCase()
var input = document.createElement("textarea");
var output = document.createElement("div");
var userlist = document.createElement("ul");
var usercont = document.createElement("div");
var topicdiv = document.createElement("div");
var topic = document.createElement("span");
var chmode = document.createElement("span");
topicdiv.appendChild(chmode);
topicdiv.appendChild(topic);
input.style.position = "absolute";
output.style.position = "absolute";
usercont.style.position = "absolute";
topicdiv.style.position = "absolute";
//input.style.border = ui["sepborder"];
output.style.border = ui["sepborder"];
usercont.style.border = ui["sepborder"];
//topicdiv.style.border = ui["sepborder"];
usercont.style.width = "75px";
topicdiv.style.top = "18px";
topicdiv.style.height = "18px";
output.style.top = "36px";
output.style.overflowY = "scroll";
output.style.overflowX = "auto";
usercont.style.top = "36px";
userlist.style.padding = "0px";
userlist.style.margin = "0px";
input.style.width = "100%";
input.style.height = "36px";
bind(input,"keydown",inputEvent);
usercont.appendChild(userlist);

input.sendto = channel;
win.chanstuff = {
"userlist":userlist,
"output":output,
"input":input,
"topic":topic,
"mode":chmode,
"users":[]
}
win.appendChild(input);
win.appendChild(output);
win.appendChild(usercont);
win.appendChild(topicdiv);
win.onuiupdate = adjustchanui;
win.onclose = partChan;

winsize(win,480,360);
targetmap[channel] = win;

return win;
}

window.adjustchanui = function(win){
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

window.newuserwin = function(username){
win = winobj(username)
username = username.toLowerCase()
var input = document.createElement("textarea");
var output = document.createElement("div");
var topicdiv = document.createElement("div");
var userhost = document.createElement("span");
topicdiv.appendChild(userhost);
input.style.position = "absolute";
output.style.position = "absolute";
topicdiv.style.position = "absolute";
output.style.border = ui["sepborder"];
topicdiv.style.top = "18px";
topicdiv.style.height = "18px";
output.style.top = "36px";
output.style.width = "100%";
output.style.overflowY = "scroll";
output.style.overflowX = "auto";
input.style.width = "100%";
input.style.height = "36px";
bind(input,"keydown",inputEvent);

input.sendto = username;
win.chanstuff = {
"output":output,
"input":input,
"userhost":userhost
}
win.appendChild(input);
win.appendChild(output);
win.appendChild(topicdiv);
win.onuiupdate = adjustuserui;

winsize(win,320,360);
targetmap[username] = win;

return win;
}
window.adjustuserui = function(win){
var inhigh = parseInt(win.chanstuff["input"].style.height);
var winhigh = parseInt(win.cont.style.height);
win.chanstuff["output"].style.height = winhigh-inhigh-36+"px";
win.chanstuff["input"].style.top = winhigh-inhigh+"px";
}

window.gettarget = function(target){
tmp = target;
target = target.toLowerCase();
if(targetmap[target])
    return targetmap[target];
if(target.charAt(0)=="#")
    return newchanwin(tmp);
return newuserwin(tmp);
}
window.inputEvent = function(event){
if((event.keyCode==13)&&(!event.shiftKey)){
    data = event.currentTarget.value;
    event.currentTarget.value = "";
    if(data.charAt(0)=="/") {
        sendCommand(data.substring(1));
    } else {
        addMessage(event.currentTarget.sendto,colorize(irc["nick"])+": <span style='color:#888;'>"+data+"</span>");
        sendCommand("PRIVMSG "+event.currentTarget.sendto+" :"+data);
    }
    event.preventDefault();
    return;
    }
}
window.sortUser = function(a,b){
    if(a[1]!=b[1])
        return irc["chstatus"].lastIndexOf(a[1])-irc["chstatus"].lastIndexOf(b[1]);
    for(i=0;i<b[0].length;i++){
        if(b[0].charCodeAt(i)!=a[0].charCodeAt(i))
            return a[0].charCodeAt(i)-b[0].charCodeAt(i);
    }
    return 0;
}
window.updateUsers = function(win){
    win.chanstuff.users.sort(sortUser);
    while(win.chanstuff.userlist.childNodes.length){
        win.chanstuff.userlist.removeChild(win.chanstuff.userlist.firstChild);
    }
    for(var u in win.chanstuff.users){
        var li = document.createElement("li");
        if(win.chanstuff.users[u][1]) li.innerHTML = win.chanstuff.users[u][1].charAt(0);
        li.style.padding = "0px";
        li.style.margin = "0px";
        li.style.listStyle = "none";
        li.innerHTML += " "+colorize(win.chanstuff.users[u][0]);
        win.chanstuff.userlist.appendChild(li);
    }
}
window.partChan = function(win){
raw("PART "+win.chanstuff.input.sendto);
}











window.socket = {"test":'f',"var":{}};
window.irc = {"nick":"unknown","chmodegrps":["beI","kfL","lj","psmntirRcOAQKVCuzNSMTG"],"chstatus":["~&@%+"],"chstatusreg":/([~&@%+]*)(.+)/,"server":"SERVER"}
function getSwf() {
if (navigator.appName.indexOf ("Microsoft") !=-1) {
return window["xmlsocket"];
} else {
return document["xmlsocket"];
}
}
response = function(anything){
document.getElementById("msg").innerHTML+= "<p>"+anything+"</p>";
return false;
}
function init(){
    
    var v = socket.test;
    var f = function(){
        var err = true;
        try{
            var m = getSwf();
            m.SetVariable(v, 't');
            if('t' != m.GetVariable(v)){
                window.setTimeout(f,0);
                return;
            }
            m.SetVariable(v, '');
            m.hardtest();
            socket.irc = m; 
            err=false;
        }
        catch(e){ 
            window.setTimeout(f,0);
        }
        if(!err&&socket.onReady)
            socket.onReady();
    }
    window.setTimeout(f,0);
}
function irc_onData(data){
    if(socket.onData)
        socket.onData(data);
}
function irc_onConnect(){
    socket.connected = true;
    if(socket.onConnect)
        socket.onConnect();
}
function irc_onError(error){
    if(socket.onError)
        socket.onError(error);
}
function irc_onClose(){
    socket.connected = false;
    if(socket.onClose)
        socket.onClose();
}
socket.connect = function(){
socket.irc.connect("sigma.pokestation.net",6667,"xmlsocket://sigma.pokestation.net:8002");
}
socket.onReady = function(){
//socket.irc.connect("irc.pokesplash.net",6667,"xmlsocket://irc.pokesplash.net:8002");
document.getElementById("msg").innerHTML = "ready!";};
socket.onConnect = ircstartup;
socket.onClose = function(){document.getElementById("msg").innerHTML += "closing...<br>";};
socket.onData = function(data){
ircdata(data);//addMessage("*Server*",data);
};
socket.onError = function(error){document.getElementById("msg").innerHTML += "Error: "+error+"<br>";};
socket.close = function(){raw("QUIT");};


window.onload = function(){
pageLoaded();
init();
}
window.onunload = socket.close;
window.onblur = function(event){
window.pagefocused = false;
}
window.onfocus = function(event){
window.pagefocused = true;
var dt = document.title.match(/IRC \((\d*)\) (.*)/);
if(dt)
    document.title = dt[2];
}
