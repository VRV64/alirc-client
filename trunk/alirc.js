/** ** VARIABLES ** **/

/* socket.irc contains the irc swf */
window.socket = {"test":'f',"var":{}};

/* irc contains server data */
window.irc = {"nick":"unknown","chmodegrps":["beI","kfL","lj","psmntirRcOAQKVCuzNSMTG"],"prefix":"qaohv","chstatus":["~&@%+"],"chstatusreg":/([~&@%+]*)(.+)/,"server":"SERVER","serverlink":"irc.somewhere.net","chantype":"#","prepend":""}

/* API handle */
window.eventhandler = {};

/* mIRC color codes */
window.mirc_colors = ["#ffffff", "#000000", "#000088", "#008800", "#ff0000", "#A52A2A", "#880088", "#ff8800", "#ffff00", "#00ff00", "#008888", "#00ffff", "#0000ff", "#ff00ff", "#888888", "#cccccc","#ffffff", "#000000", "#000088", "#008800", "#ff0000", "#A52A2A", "#880088", "#ff8800", "#ffff00", "#00ff00", "#008888", "#00ffff", "#0000ff", "#ff00ff", "#888888", "#cccccc"];

/* mIRC codes again, used to match against channel names */
window.colorcheck = {"#ffffff":"", "#000000":"", "#000088":"", "#008800":"", "#ff0000":"", "#A52A2A":"", "#880088":"", "#ff8800":"", "#ffff00":"", "#00ff00":"", "#008888":"", "#00ffff":"", "#0000ff":"", "#ff00ff":"", "#888888":"", "#cccccc":""}

/* Window UI */
window.ui = {
"color":"#000000",
"titlebg":"#004411",
"titlecolor":"white",
"titleheight":"20px",
"winborder":"1px black solid",
"winpad":3,
"buttonborder":"1px white solid",
"background":"#659b57 none",
"sepborder":"1px black solid",
"inputbackground":"#8fda7b"
};

/* Smiley regex and URL replacement */
window.smilies = [
[/o:-?\)/gi,"<img src='/resources/emotes/face-angel.png'>"],
[/:'\(/g,"<img src='/resources/emotes/face-crying.png'>"],
[/>:[\)D]/g,"<img src='/resources/emotes/face-devilish.png'>"],
[/:-?D/gi,"<img src='/resources/emotes/face-grin.png'>"],
[/:-?\*/gi,"<img src='/resources/emotes/face-kiss.png'>"],
[/:-?\|/gi,"<img src='/resources/emotes/face-plain.png'>"],
[/:-?\(/g,"<img src='/resources/emotes/face-sad.png'>"],
[/:-?\)/g,"<img src='/resources/emotes/face-smile.png'>"],
[/:-?o/gi,"<img src='/resources/emotes/face-surprise.png'>"],
[/;-?\)/g,"<img src='/resources/emotes/face-wink.png'>"]
];

/* ID assigned to current window.
 * Increases each call.
 * Serves no actual purpose */
window.winid = 1;

/* Current window container */
window.currentwin = null;

/* Bool. Is mouse holding a window */
window.dragging = false;

/* intial Z value of windows.
 * increases for each focus */
window.currentz = 10000;

/* Current Left position of dragged window */
window.dragleft = 0;

/* Current Top position of dragged window */
window.dragtop = 0;

/* Location of window when it starts */
window.initwinpos = 0;

/* Div of container that holds all the windows */
window.sandbox = null;

/* Does the page have focus? */
window.pagefocused = true;

/* What letters have been pushed already */
window.tabletters = "";

/* Currently hoverred topic */
window.currenttopic = null;

/* All of the windows */
window.targetmap = {}

/* Bind to the SWF Socket */
window.socket_init = function(){
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
        if(!err)
            pageLoaded();
    }
    window.setTimeout(f,0);
}

/* Get correct SWF element */
window.getSwf = function() {
    if (navigator.appName.indexOf ("Microsoft") !=-1)
        return window["xmlsocket"];
    else
        return document["xmlsocket"]
}

window.irc_onData = function(data){
    ircdata(data);
}
window.irc_onConnect = function(){
    socket.connected = true;
    fire("onconnected");
}
window.irc_onError = function(error){
    alert(error);
}
window.irc_onClose = function(){
    socket.connected = false;
}

/* Send data to the socket */
window.raw = function(data){
    socket.irc.send(data);
    fire("onsend",data);
}
/* ALIAS */
window.sendCommand = raw;
//TODO: Remove instances of sendCommand

/* Parses string received from server (@params data) */
window.ircdata = function(data){
    if(data.substr(0,4)=="PING"){
        raw("PO".concat(data.substring(2)));
        raw("PING "+(new Date()).valueOf());
        return;
    }
    var chunks = data.split(":");
    var params = chunks[1].split(" ");
    var message = chunks.slice(2).join(":");
    var cmd = params[1];
    var userhost = params[0].split(/(.+)!(.+)@(.+)/).slice(1,3);
    if(!userhost.length)
        userhost = [params[0], "", params[0]];
    fire("onraw",cmd,params,message);
    switch(cmd){
        case "JOIN":
            if(isMe(userhost[0])){
                raw("MODE "+message);
                addMessage(message,"You have joined "+message);
            } else{
                var chan = gettarget(message);
                chan.chanstuff.users.push([userhost[0],""]);
                updateUsers(chan);
                addMessage(message,colorize(userhost[0])+" ("+ params[0] +") has joined "+message);
            }
            fire("onjoin",userhost,message);
        break;
        case "KICK":
            if(isMe(params[3])){
                var chan = gettarget(params[2]);
                addMessage(params[2],"You have been kicked from "+params[2]+" by "+colorize(userhost[0])+" ("+message+")");
                addMessage(params[2],"<hr>",true,true);
            } else {
                var chan = gettarget(params[2]);
                removeUser(chan,params[3]);
                updateUsers(chan);
                addMessage(params[2],colorize(userhost[0])+" has kicked "+colorize(params[3])+" from "+params[2]+" ("+message+")");
            }
            fire("onkick",userhost,params[2],params[3],message);
        break;
        case "MODE":
            if(isMe(params[2])){
                addMessage(currentwin.win.chanstuff["input"].sendto,colorize(userhost[0])+" set mode "+message+" on you.");
            } else {
                var chan = gettarget(params[2]);
                var args = chan.chanstuff.mode.innerHTML.split(" ");
                var deltargs = data.split(" ").slice(3);
                var total = deltargs.join(" ");
                var delta = deltargs.shift();
                var base = args.shift();
                var m = "";
                var n = "";
                var o = 0;
                var plus = true;
                var i = -1;
                var user = "";
                var needUpdate = false;
                for(var d in delta){
                    m = delta.charAt(d);
                    if(m=="+"){plus=true;continue;}
                    if(m=="-"){plus=false;continue;}
                    if(irc.chmodegrps[1].indexOf(m)>=0){
                        if(plus){base += m; args.push(deltargs.shift());}
                        else{
                            o = 0;
                            for(var b in base){
                                n = base.charAt(b);
                                if(n==m)break;
                                if((irc.chmodegrps[1].indexOf(n)>=0)||(irc.chmodegrps[2].indexOf(n)>=0))o++;
                            }
                            base = base.replace(m,"");
                            args.splice(o,1);
                            deltargs.shift();
                        }
                    }
                    if(irc.chmodegrps[2].indexOf(m)>=0){
                        if(plus){base += m; args.push(deltargs.shift());}
                        else{
                            o = 0;
                            for(var b in base){
                                n = base.charAt(b);
                                if(n==m)break;
                                if((irc.chmodegrps[1].indexOf(n)>=0)||(irc.chmodegrps[2].indexOf(n)>=0))o++;
                            }
                            base = base.replace(m,"");
                            args.splice(o,1);
                        }
                    }
                    if(irc.chmodegrps[3].indexOf(m)>=0){
                        if(plus) base += m;
                        else base = base.replace(m,"");
                    }
                    if(irc.prefix.indexOf(m)>=0){
                        user = deltargs.shift().toLowerCase();
                        if(plus){
                            for(var u in chan.chanstuff.users){
                                if(chan.chanstuff.users[u][0].toLowerCase()==user){
                                    n = chan.chanstuff.users[u][1].split("");
                                    n.push(irc.chstatus.charAt(irc.prefix.indexOf(m)));
                                    n.sort(sortStatus);
                                    chan.chanstuff.users[u][1] = n.join("");
                                    needUpdate = true;
                                }
                            }
                        } else {
                            for(var u in chan.chanstuff.users){
                                if(chan.chanstuff.users[u][0].toLowerCase()==user){
                                    chan.chanstuff.users[u][1] = chan.chanstuff.users[u][1].replace(irc.chstatus.charAt(irc.prefix.indexOf(m)),"");
                                    needUpdate = true;
                                }
                            }
                        }
                    }
                }
                addMessage(params[2],colorize(userhost[0])+" has set mode "+total);
                chan.chanstuff.mode.innerHTML = base +" "+ args.join(" ");
                if(needUpdate) updateUsers(chan);
            }
        break;
        case "NICK":
            if(isMe(userhost[0])){
                irc.nick = message;
            }
            var target = null;
            var user = userhost[0].toLowerCase();
            for(var t in targetmap){
                target = targetmap[t];
                if(target.chanstuff.input.sendto.toLowerCase()==user){
                    addMessage(target.chanstuff.input.sendto,colorize(userhost[0])+" ("+ params[0] +") is now known as "+colorize(message));
                    targetmap[message.toLowerCase()] = target;
                    target.title.titlespan = 
                    delete targetmap[t];
                    continue;
                    }
                if(!is_chan(target.chanstuff.input.sendto)) continue;
                for(var u in target.chanstuff.users){
                    if(target.chanstuff.users[u][0].toLowerCase()==user){
                        target.chanstuff.users[u][0] = message;
                        addMessage(target.chanstuff.input.sendto,colorize(userhost[0])+" ("+ params[0] +") is now known as "+colorize(message),false,true);
                        updateUsers(target);
                        break;
                    }
                }
            }
            fire("onnick",userhost,message);
        break;
        case "NOTICE":
            if(params[2]!="AUTH")
                addMessage(currentwin.win.chanstuff["input"].sendto,colorize(userhost[0])+" (=>"+params[2]+"<=): "+irc2html(message));
            fire("onnotice",userhost,params[2],message);
        break;
        case "PART":
            var reason = "";
            if(message) reason = " ("+message+")";
            if(isMe(userhost[0])){
                if(targetmap[params[2].toLowerCase()]){
                    var chan = gettarget(params[2]);
                    addMessage(params[2],"You have left "+params[2]+reason);
                    addMessage(params[2],"<hr>",true);
                }
            } else {
                var chan = gettarget(params[2]);
                removeUser(chan,userhost[0]);
                updateUsers(chan);
                addMessage(params[2],colorize(userhost[0])+" ("+ params[0] +") has left "+params[2]+reason);
            }
            fire("onpart",userhost,params[2],message);
        break;
        case "PRIVMSG":
            if(isMe(params[2])){
                if(message.charAt(0)==""){
                    var ctcp = message.toUpperCase();
                    if(ctcp.substring(1,7)=="ACTION"){
                        addMessage(userhost[0],"* <i>"+colorize(userhost[0])+" "+irc2html(message.substring(7,message.length-1))+"</i>");
                    } else {
                        addMessage(currentwin.win.chanstuff["input"].sendto,"Received CTCP '"+irc2html(message.substring(1,message.length-1))+"' from "+colorize(userhost[0]));
                    }
                    switch(ctcp){
                        case "FINGER":
                            raw("PRIVMSG "+userhost[0]+" FINGER Your average IRC user on http://pokesplash.net");
                        break;
                        case "TIME":
                            raw("PRIVMSG "+userhost[0]+" TIME "+(new Date()).toLocaleString()+"");
                        break;
                        case "VERSION":
                            raw("PRIVMSG "+userhost[0]+" VERSION ALIRC Client v.01");
                        break;
                        case "SOURCE":
                            raw("PRIVMSG "+userhost[0]+" SOURCE URL: http://pokesplash.net/irc/alirc.php");
                        break;
                        case "CLIENTINFO":
                            raw("PRIVMSG "+userhost[0]+" CLIENTINFO Available commands: FINGER, TIME, VERSION, SOURCE, CLIENTINFO");
                        break;
                        case "CLIENTINFO FINGER":
                            raw("PRIVMSG "+userhost[0]+" CLIENTINFO FINGER - A bit of information about me");
                        break;
                        case "CLIENTINFO TIME":
                            raw("PRIVMSG "+userhost[0]+" CLIENTINFO TIME - My current time");
                        break;
                        case "CLIENTINFO VERSION":
                            raw("PRIVMSG "+userhost[0]+" CLIENTINFO VERSION - My IRC client information");
                        break;
                        case "CLIENTINFO SOURCE":
                            raw("PRIVMSG "+userhost[0]+" CLIENTINFO SOURCE - Where to get this IRC client");
                        break;
                        case "CLIENTINFO CLIENTINFO":
                            raw("PRIVMSG "+userhost[0]+" CLIENTINFO CLIENTINFO - CTCP Commands you can use on me. I see all CTCP attempts.");
                        break;
                    }
                fire("onctcp",userhost,message);
                } else {
                    addMessage(userhost[0],colorize(userhost[0])+": "+message);
                    gettarget(userhost[0]).chanstuff["userhost"].innerHTML = params[0];
                }
            }else{
                if(message.charAt(0)==""){
                    var ctcp = message.toUpperCase();
                    if(ctcp.substring(1,7)=="ACTION"){
                        addMessage(params[2],"* <i>"+colorize(userhost[0])+" "+irc2html(message.substring(7,message.length-1))+"</i>");
                    } else {
                        addMessage(params[2],"Received CTCP '"+irc2html(message.substring(1,message.length-1))+"' from "+colorize(userhost[0]));
                    }
                } else {
                    addMessage(params[2],colorize(userhost[0])+": "+irc2html(message));
                }
            }
            fire("onprivmsg",userhost,params[2],message);
        break;
        case "PONG":
            var n = (new Date()).valueOf();
            var l = (n-parseInt(message))/20;
            gettarget(irc.server).chanstuff.userhost.innerHTML = "LAG: "+Math.floor(l)+" cs";
        break;
        case "QUIT":
            var target = null;
            var u = userhost[0].toLowerCase();
            for(var t in targetmap){
                target = targetmap[t];
                if(target.chanstuff.input.sendto.toLowerCase()==u)
                    addMessage(target.chanstuff.input.sendto,colorize(userhost[0])+" ("+ params[0] +") has quit ("+irc2html(message)+")");
                if(!is_chan(target.chanstuff.input.sendto)) continue;
                if(removeUser(target,userhost[0])){
                    updateUsers(target);
                    addMessage(target.chanstuff.input.sendto,colorize(userhost[0])+" ("+ params[0] +") has quit ("+irc2html(message)+")",false,true);
                }
            }
            fire("onquit",userhost,message);
        break;
        case "TOPIC":
            addMessage(params[2],colorize(userhost[0])+" has changed the topic to: "+irc2html(message));
            var chan = gettarget(params[2]);
            chan.chanstuff.topic.innerHTML = irc2html(message);
            var d = new Date();
            chan.chanstuff.topic.parentNode.setAttribute("title","Topic set by "+userhost[0]+" on "+d.toLocaleString());
            
        break;
        /* Show message, nothing else */
        case "251"://lusers
        case "255":
        case "265":
        case "266":
        case "290"://helpop
        case "291":
        case "292":
        case "372"://motd
        case "375":
            addMessage(irc.server,message);
        break;
        /* Show nothing at all */
        case "001":
            irc.serverlink = userhost[0];
            irc.stable = true;
            fire("onready");
        break;
        case "002":
        case "003":/* 001-004 can't be used because irc.server doesn't exist yet :( */
        case "004":
        case "366"://end names
        case "376"://end motd
        break;
        /* ISUPPORT */
        case "005":
            for(var p in params){
                keyval = params[p].split("=");
                switch(keyval[0]){
                    case 'CHANMODES':
                        irc.chmodegrps = keyval[1].split(",");
                    break;
                    case 'CHANTYPES':
                        irc.chantype = keyval[1];
                    break;
                    case 'NAMESX':
                        raw("protoctl namesx");// /names will send all statuses
                    break;
                    case 'NETWORK':
                        irc.server = keyval[1];
                        gettarget(irc.server).closebutton.removeEventListener("click",deletewin);
                    break;
                    case 'PREFIX':
                        var pref = keyval[1].match(/\((.*)\)(.*)/);
                        irc.prefix = pref[1];
                        irc.chstatus = pref[2];
                        irc.chstatusreg = new RegExp("(["+irc.chstatus+"]*)(.+)")
                    break;
                }
            }
        break;
        /* Param[2] + message */
        case "252":
        case "253":
        case "254":
            addMessage(irc.server,params[2].concat(" ",message));
        break;
        /* current window: message (param[3]) */
        case "401":
            addMessage(currentwin.win.chanstuff["input"].sendto,message+" ("+colorize(param[3])+")");
        break;
        /* Show to current window */
        case "404":
            addMessage(currentwin.win.chanstuff["input"].sendto,message);
        break;
        case "307":/* Whois lines */
        case "310":
        case "313":
        case "335":
        case "378":
        case "671":
            var target = gettarget("Whois");
            addMessage("Whois",params[3]+" "+message,1,1);
        break;
        case "301":/*whois away */
            addMessage("Whois","<b>Away:</br> "+irc2html(message),1,1);
        break;
        case "311":/*create whois window*/
            var target = gettarget("Whois");
            target.chanstuff["input"].style.height="1px";
            target.chanstuff["input"].disabled=true;
            adjustuserui(target);
            var p = document.createElement("h3");
            p.innerHTML = params[3];
            p.style.margin = "0px";
            p.style.fontSize = "12px";
            p.style.textAlign = "center";
            var output = target.chanstuff["output"];
            var willScroll = (output.clientHeight+output.scrollTop >= output.scrollHeight);
            output.appendChild(p);
            if(willScroll) output.scrollTop = output.scrollHeight-output.clientHeight;
            addMessage("Whois","<b>Userhost:</b> "+params[4]+"@"+params[5],1,1);
            addMessage("Whois","<b>Real Name:</b> "+irc2html(message),1,1);
        break;
        case "312":
            addMessage("Whois","<b>Server:</b> "+params[5]+" ("+irc2html(message)+")",1,1);
        break;
        case "317":
            var j = parseInt( params[4] / 86400 );
            var h = parseInt( params[4] / 3600 ) % 24;
            var m = parseInt( params[4] / 60 ) % 60;
            var s = parseInt( params[4] % 60 );
            var res = [];
            if(j) res.push(j+" days");
            if(h) res.push(h+" hours");
            if(m) res.push(m+" minutes");
            if(s&&!j&&!h) res.push(s+" secs");
            var d = new Date(parseInt(params[5])*1000);
            addMessage("Whois","<b>Signed on:</b> "+d.toLocaleString(),1,1);
            addMessage("Whois","<b>Idle:</b> "+res.join(", "));
        break;
        case "318":
            addMessage("Whois","<hr>",1,1);
        break;
        case "319":
            addMessage("Whois","<b>Currently in:</b> "+irc2html(message),1,1);
        break;
        case "321":// init /list
            irc.channellist = [];
        break;
        case "322":
            //addMessage("Channels List",params[3]+" ("+params[4]+") "+message,true,true);
            irc.channellist.push({"name":params[3],"users":params[4],"topic":message});
        break;
        case "323"://end /list
            var target = gettarget("Channels List");
            clearlines(target);
            if(target.chanstuff.input.tagName == "TEXTAREA"){
                var i = [target.chanstuff.input.style.height,target.chanstuff.input.style.top];
                var input = document.createElement("div");
                input.style.height = i[0];
                input.style.width = "100%";
                input.style.top = i[1];
                input.style.position = "absolute";
                input.style.textAlign = "center";
                input.innerHTML = "<a href='javascript:sortChanListName();'>Sort by Name</a> | <a href='javascript:sortChanListUser();'>Sort by Users</a> | <a href='javascript:raw(\"list\");'>Refresh List</a>";
                input.sendto = "channels list";
                target.replaceChild(input,target.chanstuff.input);
                delete target.chanstuff.input;
                target.chanstuff.input = input;
            }
            irc.channellist.sort(chanNameCmp);
            for(var c in irc.channellist){
                addMessage("Channels List",chanLink(irc.channellist[c]["name"])+" ("+irc.channellist[c]["users"]+") "+irc2html(irc.channellist[c]["topic"]),true,true);
            }
        break;
        case "324"://mode [chmode list]
            var chan = gettarget(params[3]);
            chan.chanstuff.mode.innerHTML = data.split(" ").slice(4).join(" ");
        break;
        case "329"://mode modified
            var chan = gettarget(params[3]);
            var d = new Date(parseInt(params[4])*1000);
            chan.chanstuff.topic.parentNode.setAttribute("title","Mode changed on "+d.toLocaleString());
        break;
        case "332"://topic
            var chan = gettarget(params[3]);
            chan.chanstuff.topic.innerHTML = irc2html(message);
            addMessage(params[3],"The topic in "+params[3]+" is currently: "+irc2html(message));
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
            updateUsers(chan);
        break;
        case "433":
            if(!irc.stable){
                irc.nick += "_";
                raw("NICK "+irc["nick"]);
            } else {
                addMessage(currentwin.win.chanstuff["input"].sendto,message);
            }
        break;
        default:
            addMessage(irc.server,data);
        break;
    }
}

/* Adds @param html to @param nam's output window 
 * @param hideTime - true = do not display time value
 * @param noCount - true = do not add to Message count */
window.addMessage = function(nam,html,hideTime,noCount){
    var p = document.createElement("p");
    var d = new Date();
    if(!hideTime)
        p.innerHTML = "[".concat(timepad(d.getHours()),":",timepad(d.getMinutes()),"] ");
    p.innerHTML += html;
    p.style.margin = "0px";
    p.style.fontSize = "12px";
    p.style.textAlign = "left";
    var target = gettarget(nam);
    var output = target.chanstuff["output"];
    var willScroll = (output.clientHeight+output.scrollTop >= output.scrollHeight);
    output.appendChild(p);
    if(willScroll)//FIXME: account for smiley load time
        output.scrollTop = output.scrollHeight-output.clientHeight;
    if(!!noCount)
        return;
    if((currentwin!=target.cont)||(currentwin.style.visibility=="hidden")){
        if(!target.msgs.innerHTML)
            target.msgs.innerHTML = "(1)";
        else
            target.msgs.innerHTML = "("+(parseInt(target.msgs.innerHTML.substring(1))+1)+")";
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
}


/* Check nick with current nick */
window.isMe = function(nick){
    if(nick.toLowerCase()==irc['nick'].toLowerCase())
        return true;
    return false;
}

/* Check for user in chan */
window.in_users = function(user,channames){
    user = user.toLowerCase();
    for(var key in channames){
        if(channames[key][0].toLowerCase()==user)
            return true;
    }
    return false;
}

/* Check is @param nam is a channel */
window.is_chan = function(nam){
    return !!(nam.substring(0,1)==irc.chantype);
}

/* blank function */
window.blank = function(){
    return false;
}

/* removes the prefixes of a nick */
window.trimstatus = function(str) {
    for (var i = 0; i < str.length; i++) {
        if (irc["chstatus"].indexOf(str.charAt(i)) === -1) {
            str = str.substring(i);
            break;
        }
    }
    return str;
}

/* Removese @param user from @param chan */
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

/* Adds 0 in front of a 1 digit number */
window.timepad = function(number) {
    return (number < 10) ? '0'+number : number;
}

/* Link */
window.urlLinkFunc = function(str){
    return "<a href='"+str+"' target='_blank'>"+str+"</a>";//TODO: Non _blank urls?
}

/* Provide clickable chan link */
window.chanLink = function(str){
    if(str in colorcheck)
        return str;
    return "<a href='irc://"+irc.serverlink+"/"+str+"' onclick='raw(\"join "+str+"\");return false;' title='Click to join "+str+"'>"+str+"</a>";
}

/* converts text into html */
window.irc2html = function(irctext){
    var irctext = irctext.split("");
    var c = "";
    var bold = false;
    var underline = false;
    var reverses = false;
    var font = {"on":false,"fg0":-1,"fg1":-1,"bg0":-1,"bg1":-1,"fg":-1,"bg":-1};
    var skip = 0;
    for(var t=0;t<irctext.length;t++){
        if(skip) { 
            irctext[t] = "";
            skip--; continue;
        }
        c = irctext[t];
        switch(c){
            case "":
                if(bold) c = "</b>";
                else c = "<b>";
                bold = !bold;
            break;
            case "":
                if(font.on) { c = "</span>"; font.on = false; }
                else c = "";
                var i = t;
                if(!isNaN(irctext[i+1])){
                    font.fg0 = irctext[i+1];
                    i++;
                    if(!isNaN(irctext[i+1])){
                        font.fg1 = irctext[i+1];
                        i++;
                    }
                }
                if(irctext[i+1]==","){
                    i++;
                    if(!isNaN(irctext[i+1])){
                        font.bg0 = irctext[i+1];
                        i++;
                        if(!isNaN(irctext[i+1])){
                            font.bg1 = irctext[i+1];
                            i++;
                        }
                    }
                }
                if(font.fg0!=-1){
                    if(font.fg1!=-1){
                        font.fg = font.fg0 + font.fg1;
                    } else {
                        font.fg = font.fg0;
                    }
                    font.on = true;
                }
                if(font.bg0!=-1){
                    if(font.bg1!=-1){
                        font.bg = font.bg0 + font.bg1;
                    } else {
                        font.bg = font.bg0;
                    }
                    font.on = true;
                }
                if(font.fg) c += "<span style='color:"+mirc_colors[parseInt(font.fg)]+";";
                if(font.bg) { if(font.fg==-1) c += "<span style='"; c += "background-color:"+mirc_colors[parseInt(font.bg)]+";";}
                if(font.on) c+= "'>";
                font.fg0 = font.fg1 = font.bg0 = font.bg1 = -1;
                skip = i-t;
            break;
            case "":
                if(reverses) {c = "</span>"; reverses = false; break; }
                if(font.fg==-1)font.fg=0;
                if(font.bg==-1)font.bg=1;
                reverses = true;
                c = "<span style='color:"+mirc_colors[parseInt(font.bg)]+";background-color:"+mirc_colors[parseInt(font.fg)]+";'>";
            break;
            case "":
                if(underline) c = "</u>";
                else c = "<u>";
                underline = !underline;
            break;
            case "":
                c = "";
                if(bold) c += "</b>";
                if(underline) c += "</u>";
                if(reverses) c += "</span>";
                if(font.on) c += "</span>";
                bold = false;
                underline = false;
                reverses = false;
                font = {"on":false,"fg0":-1,"fg1":-1,"bg0":-1,"bg1":-1,"fg":-1,"bg":-1};
            break;
        }
        irctext[t] = c;
    }   
    c = "";
    if(bold) c += "</b>";
    if(underline) c += "</u>";
    if(reverses) c += "</span>";
    if(font.on) c += "</span>";
    irctext = irctext.join("")+c;

    irctext = irctext.replace(/(#[^ ;@!><"]+)/gi,chanLink).replace(/(http:\/\/[^ <>"']+)/gi,urlLinkFunc);
    
    for(var smil in smilies){
        irctext = irctext.replace(smilies[smil][0],smilies[smil][1]);
    }
    return irctext;
}

/* Colorize a nick */
window.colorize = function(str){
    var rgb = hue2rgb(str2deg(str));
    return "<span style='color:rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+");'>"+str+"</span>";
}

/* Gets a color from a degree value */
window.hue2rgb = function(deg){
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

/* gets a degree (0-360) from a string */
window.str2deg = function(str){
    var cnt = 0;
    for(var i=0;i<str.length;i++){
        cnt ^= str.charCodeAt(i);
    }
    return (cnt*8)%360;
}

/* create a binding event of @param event for @param element to do @param method */
window.bind = function(element,event,method){
    if(element.addEventListener)
        element.addEventListener(event,method,false);
    else
        element.attachEvent("on"+event,method);
}

/* initialize sandbox */
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
}

/* creates a moveable window instance */
window.winobj = function(titletext){
    //TODO: Leave as function or turn into class?
    var wincont = document.createElement("div");
    wincont.style.width = "200px";
    wincont.style.height= "300px";
    wincont.style.position = "absolute";
    wincont.style.left = initwinpos+"px";
    wincont.style.top = initwinpos%256+"px";
    initwinpos += 18;
    wincont.style.zIndex = currentz++;
    var win = document.createElement("div");
    win.style.padding = ui["winpad"]+"px";
    win.style.margin = "0px";
    win.style.height= "100%";
    win.style.width = "100%";
    win.style.position = "relative";
    win.style.background = ui["background"];
    win.style.color = ui["color"];
    win.style.border = ui["winborder"];
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
    title.titlespan = titlespan;
    title.appendChild(titlespan);
    bind(title,"mousedown",startdrag);
    bind(title,"dblclick",shadewin);
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
    var shadebutton = document.createElement("div");
    shadebutton.innerHTML = "=";
    shadebutton.style.left="0px";
    shadebutton.style.top="0px";
    shadebutton.style.position="absolute";
    shadebutton.style.border = ui["buttonborder"];
    shadebutton.style.cursor = "default";
    bind(shadebutton,"click",shadewin);
    title.appendChild(shadebutton);
    win.appendChild(title);
    win.id = "vwin"+winid;
    win.closebutton = closebutton;
    win.shadebutton = shadebutton;
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

/* Correctly distances titlebar within @param win */
window.adjustui = function(win){
    win.titlediv.style.width = win.style.width;
    var w = parseInt(win.cont.style.width);
    win.closebutton.style.left = w-15+"px";
    win.shadebutton.style.left = w-30+"px";
    win.onuiupdate(win);
}

/* sets the size of @param win */
window.winsize = function(win,width,height){
    win.cont.style.height = height+"px";
    win.cont.style.width = width+"px";
    adjustui(win);
}

/* shade (hides contents except for titlebar) event */
window.shadewin = function(event){
    var tmp = event.target.parentNode;
    if(tmp.cont)
        currentwin = tmp.cont;
    else
        currentwin = tmp.parentNode.cont;
    document.body.focus();
    if(currentwin.style.visibility!="hidden"){
        currentwin.style.visibility="hidden";
        currentwin.win.titlediv.style.visibility="visible";
    } else {
        currentwin.style.visibility="visible";
    }
    return false;
}

/* click on title of window event */
window.startdrag = function(event){
    var tmp = event.target.parentNode;
    if(tmp.cont)
        currentwin = tmp.cont;
    else
        currentwin = tmp.parentNode.cont;
    dragleft = parseInt(currentwin.style.left)-event.clientX;
    dragtop = parseInt(currentwin.style.top)-event.clientY;
    dragging = true;
    document.body.focus();
    document.onselectstart = blank;
    return false;
}

/* release title of window event */
window.stopdrag = function(event){
    if(!dragging)
        return;
    dragging = false;
    document.onselectstart = null;
    if(currentwin.win.chanstuff)
        currentwin.win.chanstuff.input.focus();
}

/* moving the window event */
window.move = function(event){
    if(!dragging)
        return;
    currentwin.style.left = dragleft+event.clientX+"px";
    currentwin.style.top = dragtop+event.clientY+"px";
    return false;
}

/* Close window */
window.deletewin = function(event){
    var tmp = event.target.parentNode;
    if(tmp.cont)
        win = tmp;
    else
        win = tmp.parentNode;
    win.onclose(win)
    sandbox.removeChild(win.cont);
    if(targetmap[win.chanstuff.input.sendto])
        delete targetmap[win.chanstuff.input.sendto];
    delete win;
}

/* focus on window event */
window.wintotop = function(event){
    var tmp = event.target;
    if(!tmp)
        return;
    for(i=0;i<40;i++){
        if (tmp.cont){
            tmp.cont.style.zIndex = currentz++;
            currentwin = tmp.cont;
            clearMsgs(currentwin.win);
            return;
        } else {
            tmp = tmp.parentNode;
        }
    }
}

/* Clears the (#) in @param win when focused */
window.clearMsgs = function(win){
    win.msgs.innerHTML = "";
}

/* Clears text in output */
window.clearlines = function(win){
    while(win.chanstuff.output.childNodes.length)
        win.chanstuff.output.removeChild(win.chanstuff.output.firstChild);
}

/* Fetch window @param target */
window.gettarget = function(target){
    tmp = target;
    target = target.toLowerCase();
    if(targetmap[target])
        return targetmap[target];
    if(is_chan(target))
        return newchanwin(tmp);
    else
        return newuserwin(tmp);
}

/* Create a channel window instance */
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
    topicdiv.appendChild(document.createTextNode("["));
    topicdiv.appendChild(chmode);
    topicdiv.appendChild(document.createTextNode("] "));
    topicdiv.appendChild(topic);
    input.style.position = "absolute";
    output.style.position = "absolute";
    usercont.style.position = "absolute";
    topicdiv.style.position = "absolute";
    output.style.border = ui["sepborder"];
    usercont.style.border = ui["sepborder"];
    usercont.style.width = "75px";
    topicdiv.style.top = (18+ui["winpad"])+"px";
    topicdiv.style.height = "18px";
    topicdiv.style.width = "100%";
    topicdiv.style.overflow = "hidden";
    topicdiv.style.fontSize = "12px";
    topicdiv.style.background = ui["background"];
    topicdiv.style.border = ui["winborder"];
    topicdiv.style.cursor = "pointer";
    output.style.top = (36+ui["winpad"]*2)+"px";
    output.style.overflowY = "scroll";
    output.style.overflowX = "auto";
    usercont.style.top = (36+ui["winpad"]*2)+"px";
    usercont.style.overflow = "scroll";
    userlist.style.padding = "0px";
    userlist.style.margin = "0px";
    input.style.width = "100%";
    input.style.height = "36px";
    input.style.padding = "0px";
    input.style.backgroundColor = ui["inputbackground"];
    input.style.color = ui["color"];
    input.style.border = ui["winborder"];
    bind(input,"keydown",inputEvent);
    bind(topic,"mouseover",focusTopic);
    bind(topic,"mouseout",unfocusTopic);
    usercont.appendChild(userlist);
    input.sendto = channel;
    win.chanstuff = {
        "userlist":userlist,
        "output":output,
        "input":input,
        "scroll":[],
        "currentScroll":0,
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
    input.focus();
    return win;
}

/* Creates a user window (has no userlist) */
window.newuserwin = function(username){
    //TODO: merge new????win instances
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
    topicdiv.style.top = (18+ui["winpad"])+"px";
    topicdiv.style.height = "18px";
    topicdiv.style.overflow = "hidden";
    topicdiv.style.fontSize = "12px";
    topicdiv.style.border = ui["winborder"];
    topicdiv.style.cursor = "default";
    output.style.top = (36+ui["winpad"]*2)+"px";
    output.style.width = "100%";
    output.style.overflowY = "scroll";
    output.style.overflowX = "auto";
    input.style.width = "100%";
    input.style.height = "36px";
    input.style.padding = "0px";
    input.style.backgroundColor = ui["inputbackground"];
    input.style.color = ui["color"];
    input.style.border = ui["winborder"];
    bind(input,"keydown",inputEvent);
    input.sendto = username;
    win.chanstuff = {
        "output":output,
        "input":input,
        "scroll":[],
        "currentScroll":0,
        "userhost":userhost,
        "topic":topicdiv
    }
    win.appendChild(input);
    win.appendChild(output);
    win.appendChild(topicdiv);
    win.onuiupdate = adjustuserui;
    winsize(win,320,360);
    targetmap[username] = win;
    return win;
}

/* Adjust chan @param win contents */
window.adjustchanui = function(win){
    //TODO: Account for borders in widths
    var listwidth = parseInt(win.chanstuff["userlist"].parentNode.style.width);
    var winwidth = parseInt(win.cont.style.width);
    win.chanstuff["output"].style.width = winwidth-listwidth-ui["winpad"]+"px";
    win.chanstuff["userlist"].parentNode.style.left = winwidth-listwidth+ui["winpad"]+"px";
    win.chanstuff["topic"].parentNode.style.width = winwidth+"px";
    win.chanstuff["input"].style.width = winwidth+"px";
    var inhigh = parseInt(win.chanstuff["input"].style.height);
    var winhigh = parseInt(win.cont.style.height);
    win.chanstuff["output"].style.height = winhigh-inhigh-36-ui["winpad"]*3+"px";
    win.chanstuff["input"].style.top = winhigh-inhigh+"px";
    win.chanstuff["userlist"].parentNode.style.height = win.chanstuff["output"].style.height;
}

/* Adjust user @param win contents */
window.adjustuserui = function(win){
    //TODO: Account for borders in widths
    var winwidth = parseInt(win.cont.style.width);
    win.chanstuff["topic"].style.width = winwidth+"px";
    win.chanstuff["input"].style.width = winwidth+"px";
    win.chanstuff["output"].style.width = winwidth+"px";
    var inhigh = parseInt(win.chanstuff["input"].style.height);
    var winhigh = parseInt(win.cont.style.height);
    win.chanstuff["output"].style.height = winhigh-inhigh-36-ui["winpad"]*3+"px";
    win.chanstuff["input"].style.top = winhigh-inhigh+"px";
}

/* Topic mouseover event */
window.focusTopic = function(event){
    var tmp = event.target.parentNode.parentNode;//target(topic)->topicdiv->win OR target(textnode)->topic->topicdiv->win
    if(tmp.cont)
        currenttopic = event.target.parentNode;
    else
        currenttopic = event.target.parentNode.parentNode;
    currenttopic.style.height = "auto";
}

/* Topic unmouseover event */
window.unfocusTopic = function(){
    currenttopic.style.height = "18px";
}

/* user types in input window event */
window.inputEvent = function(event){
    if((event.keyCode==13)&&(!event.shiftKey)){
        var data = event.currentTarget.value;
        event.currentTarget.value = "";
        if(data.charAt(0)=="/") {
            userCommand(data.substring(1),event.currentTarget.sendto);
        } else {
            var lines = data.split("\n");
            while(data = lines.shift()){
                addMessage(event.currentTarget.sendto,colorize(irc["nick"])+": "+irc2html(irc.prepend+data));
                sendCommand("PRIVMSG "+event.currentTarget.sendto+" :"+irc.prepend+data);
            }
        }
        var target = gettarget(event.currentTarget.sendto);
        target.chanstuff.currentScroll = target.chanstuff.scroll.push(data);
        event.preventDefault();
        return false;
    }
    if(event.keyCode==38){
        var target = gettarget(event.currentTarget.sendto);
        if (target.chanstuff.currentScroll >= 0){
            if(event.currentTarget.value)
                target.chanstuff.scroll[target.chanstuff.currentScroll--] = event.currentTarget.value;
            else
                target.chanstuff.currentScroll--;
        }
        if (target.chanstuff.currentScroll >= 0) event.currentTarget.value = target.chanstuff.scroll[target.chanstuff.currentScroll];
        else {event.currentTarget.value = "";target.chanstuff.currentScroll++;}
        event.preventDefault();
        return false;
    }
    if(event.keyCode==40){
        var target = gettarget(event.currentTarget.sendto);
        event.currentTarget.value = target.chanstuff.scroll[target.chanstuff.currentScroll++];
        if(event.currentTarget.value=="undefined"){event.currentTarget.value = ""; target.chanstuff.currentScroll--;}
        event.preventDefault();
        return false;
    }
    if(event.ctrlKey){
        //FIXME: firefox issues sometimes, some already bound
        switch(event.keyCode){
            case 66://bold
                event.currentTarget.value += String.fromCharCode(2);
                event.preventDefault();
                return false;
            break;
            case 75://color
                //TODO: color picker
                event.currentTarget.value += String.fromCharCode(3);
                event.preventDefault();
                return false;
            break;
            case 79://format canceller
                event.currentTarget.value += String.fromCharCode(0xf);
                event.preventDefault();
                return false;
            break;
            case 82://reverses
                event.currentTarget.value += String.fromCharCode(0x16);
                event.preventDefault();
                return false;
            break;
            case 85://underlines
                event.currentTarget.value += String.fromCharCode(0x1f);
                event.preventDefault();
                return false;
            break;
        }
    }
    if((event.keyCode==9)&&(!event.shiftKey)){
        if(tabletters=="") {
            event.preventDefault();
            return false;
        }
        var win = currentwin.win;
        var l = tabletters.length;
        for(var u in win.chanstuff.users){
            if(win.chanstuff.users[u][0].substring(0,l).toUpperCase()==tabletters){
                event.currentTarget.value = event.currentTarget.value.substring(0,event.currentTarget.value.length-l)+win.chanstuff.users[u][0];
                break;
            }
        }
        event.preventDefault();
        return false;
    }
    if((event.keyCode>47) && (event.keyCode<91)){
        window.tabletters += String.fromCharCode(event.keyCode);
    } else if(event.keyCode==8) {
        window.tabletters = tabletters.substring(0,tabletters.length-1);
    } else {
        window.tabletters = "";
    }
}

window.userCommand = function(data,target){
    var params = data.split(" ");
    var cmd = params.shift().toUpperCase();
    switch(cmd){
        case "CTCP":
            return sendCommand("PRIVMSG "+target+" "+params.join(" ")+"");
        break;
        case "K":
        case "KICK":
            if(!is_chan(params[0])) params.unshift(target);
            return sendCommand("KICK "+params.join(" "));
        break;
        case "J":
            return sendCommand("JOIN "+params.join(" "));
        break;
        case "QUERY":
            var m = params.slice(1).join(" ");
            if(m)
                addMessage(params[0],colorize(irc.nick)+": "+m);
            else{
                gettarget(params[0]);
                return;
            }
        case "MSG":
            return sendCommand("PRIVMSG "+params.join(" "));
        break;
        case "UMODE":
            return sendCommand("MODE "+irc.nick+" "+params.join(" "));
        break;
        case "MODE":
            if((!is_chan(params[0]))&&(!isMe(params[0]))) params.unshift(target);
            return sendCommand("MODE "+params.join(" "));
        break;
        case "HELP":
            return sendCommand("HELP ?"+params.join(" "));
        break;
        case "ACTION":
        case "ME":
            var m = params.join(" ");
            sendCommand("PRIVMSG "+target+" ACTION "+m+"");
            addMessage(currentwin.win.chanstuff.input.sendto,"* <i>"+colorize(irc.nick)+" "+irc2html(m)+"</i>");
            return;
        break;
        case "T":
        case "TOPIC":
            if(!is_chan(params[0])) params.unshift(target);
            return sendCommand("TOPIC "+params.join(" "));
        break;
        case "OP":
            if(!params.length) params.push(irc.nick);
            return sendCommand("MODE "+target+" +o "+params.join(" "));
        break;
        case "DEOP":
            if(!params.length) params.push(irc.nick);
            return sendCommand("MODE "+target+" -o "+params.join(" "));
        break;
        case "WII":
            return sendCommand("WHOIS "+params[0]+" "+params[0]);
        break;
        case "STYLE":
        case "PRE":
            irc.prepend = params.join(" ");
            addMessage(currentwin.win.chanstuff.input.sendto,irc2html(irc.prepend+"New style has been set"));
            return;
        break;
        case "CLEAR":
            return clearlines(currentwin.win);
        break;
    }
    return raw(data);
}

/* generates user list */
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
        li.style.whiteSpace = "nowrap";
        li.style.fontSize = "12px";
        li.style.cursor = "pointer";
        li.innerHTML += " "+colorize(win.chanstuff.users[u][0]);
        bind(li,"dblclick",queryUser);
        win.chanstuff.userlist.appendChild(li);
    }
}

/* leaves channel without closing */
window.partChan = function(win){
    raw("PART "+win.chanstuff.input.sendto);
}

/* doubleclick on user event */
window.queryUser = function(event){
    var tmp = event.target;
    if(tmp.firstChild) tmp = tmp.firstChild;
    if(tmp.nextSibling) tmp = tmp.nextSibling;
    if(tmp.firstChild) tmp = tmp.firstChild;//should be a text node by this point
    wintotop({"target":{"cont":gettarget(tmp.nodeValue)} })
}

/* User sorting formula */
window.sortUser = function(a,b){
    if(a[1]!=b[1])
        return irc["chstatus"].lastIndexOf(a[1])-irc["chstatus"].lastIndexOf(b[1]);
    for(i=0;i<b[0].length;i++){
        if(b[0].charCodeAt(i)!=a[0].charCodeAt(i))
            return a[0].charCodeAt(i)-b[0].charCodeAt(i);
    }
    return 0;
}

/* Sort user prefixes */
window.sortStatus = function(a,b){
    return irc["chstatus"].lastIndexOf(a)-irc["chstatus"].lastIndexOf(b);
}

/* Sort user list by name function */
window.chanNameCmp = function(a, b) {
var A = a["name"].toLowerCase();
var B = b["name"].toLowerCase();
if (A < B) {return -1}
if (A > B) {return 1}
return 0;
}

/* Sort user list by users function */
window.chanUsersCmp = function(a, b) {
var A = parseInt(a["users"]);
var B = parseInt(b["users"]);
return A-B;
}

/* Sort user list by name */
window.sortChanListName = function(){
    var target = gettarget("Channels List");
    clearlines(target);
    irc.channellist.sort(chanNameCmp);
    for(var c in irc.channellist){
        addMessage("Channels List",irc.channellist[c]["name"]+" ("+irc.channellist[c]["users"]+") "+irc2html(irc.channellist[c]["topic"]),true,true);
    }
}

/* Sort user list by users */
window.sortChanListUser = function(){
    var target = gettarget("Channels List");
    clearlines(target);
    irc.channellist.sort(chanUsersCmp);
    for(var c in irc.channellist){
        addMessage("Channels List",irc.channellist[c]["name"]+" ("+irc.channellist[c]["users"]+") "+irc2html(irc.channellist[c]["topic"]),true,true);
    }
}

/* fire all api events named on @param event */
window.fire = function(event,a1,a2,a3,a4){
    //TODO: remove ugly hack.
    var handler = event;
    for(var e in eventhandler[handler]){
        eventhandler[handler][e](a1,a2,a3,a4);
    }
}

/* hooks so that @param func() will be run on @param event */
window.hook = function(event,func){
    var handler = event;
    eventhandler[handler].push(func);
}

/** ========= **/
/** == API == **/
/** ========= **/

/* getHostData
 @ params userhost
 = return {"nick":nick,"user":user,"host":host}
*/
window.getHostData = function(userhost){
    return {"nick":userhost[0],"user":userhost[1],"host":userhost[2]};
}

/* PRIVMSG
 @ param userhost
 @ param target
 @ param message
 */
eventhandler.onprivmsg = [];

/* NOTICE
 @ param userhost
 @ param target
 @ param message
 */
eventhandler.onnotice = [];

/* JOIN
 @ param userhost
 @ param channel
 */
eventhandler.onjoin = [];

/* PART
 @ param userhost
 @ param channel
 @ param message
 */
eventhandler.onpart = [];

/* KICK
 @ param userhost
 @ param channel
 @ param target
 @ param message
 */
eventhandler.onkick = [];

/* NICK
 @ param userhost
 @ param nick
 */
eventhandler.onnick = [];

/* QUIT
 @ param userhost
 @ param message
 */
eventhandler.onquit = [];

/* RAW
 @ param command
 @ param params
 @ param message
 */
eventhandler.onraw = [];

/* CTCP
 @ param userhost
 @ param message
 */
eventhandler.onctcp = [];

/* CONNECT */
eventhandler.onconnect = [];

/* CONNECTED */
eventhandler.onconnected = [];

/* READY */
eventhandler.onready = [];

/* DISCONNECT */
eventhandler.ondisconnect = [];

/* SEND
 @param rawdata
 */
eventhandler.onsend = [];






hook("onconnect",function(){
    socket.irc.connect("irc.pokesplash.net",6667,"xmlsocket://irc.pokesplash.net:8002");
    window.onunload = function(){
        fire("ondisconnect");
    };
    window.onbeforeunload = function(event){
        if(!event)
            event = window.event;
        event.cancelBubble = true;
        event.returnValue = 'If you leave this page, your chat session will end. Are you sure you want to leave this page?';
        if (event.stopPropagation) {
            event.stopPropagation();
            event.preventDefault();
        }
        return 'If you leave this page, your chat session will end. Are you sure you want to leave this page?';
    };
    window.onblur = function(event){
        window.pagefocused = false;
    };
    window.onfocus = function(event){
        window.pagefocused = true;
        var dt = document.title.match(/IRC \((\d*)\) (.*)/);
        if(dt)
            document.title = dt[2];
    };
});

hook("onconnected",function(){
    irc["nick"] = document.getElementById("nick").value;
    try{
        irc["user"] = document.getElementById("user").value;
        if(!irc["user"]) irc["user"] = irc["nick"];
    } catch(e) {
        irc["user"] = irc["nick"];
    }
    raw("USER al-"+irc["user"]+" 8 0 :"+irc["nick"]);
    raw("NICK "+irc["nick"]);
});

hook("onready",function(){
    try{
        var nspass = document.getElementById("pass").value;
        if(nspass)
            raw("NS IDENTIFY "+nspass);
    } catch(e) {
    }
    try{
        var joinch = document.getElementById("chans").value;
        if(joinch)
            raw('join '+joinch);
        else
            raw('join #pokesplash');
    } catch(e) {
        raw('join #pokesplash');
    }
});


window.onload = socket_init;
