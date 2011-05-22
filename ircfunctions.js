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
		raw("PO".concat(data.substring(2)));
        raw("PING "+(new Date()).valueOf())
        return;
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
                addMessage(message,"You have joined "+message);
            } else{
                var chan = gettarget(message);
                chan.chanstuff.users.push([userhost[0],""]);
                updateUsers(chan);
                addMessage(message,colorize(userhost[0])+" ("+ params[0] +") has joined "+message);
            }
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
            //console.log(data);
            
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

        break;
        case "NOTICE":
            if(params[2]!="AUTH")
                addMessage(currentwin.win.chanstuff["input"].sendto,colorize(userhost[0])+" (=>"+params[2]+"<=): "+irc2html(message));
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
        break;
        case "PONG":
            var n = (new Date()).valueOf();
            var l = (n-parseInt(message))/2;
            gettarget(irc.server).chanstuff.userhost.innerHTML = "LAG: "+Math.floor(l)+" ms";
        break;
        case "QUIT":
            var target = null;
            var u = userhost[0].toLowerCase();
            for(var t in targetmap){
                target = targetmap[t];
                if(target.chanstuff.input.sendto.toLowerCase()==u)
                    addMessage(target.chanstuff.input.sendto,colorize(userhost[0])+" ("+ params[0] +") has quit ("+message+")");
                if(!is_chan(target.chanstuff.input.sendto)) continue;
                if(removeUser(target,userhost[0])){
                    updateUsers(target);
                    addMessage(target.chanstuff.input.sendto,colorize(userhost[0])+" ("+ params[0] +") has quit ("+message+")",false,true);
                }
            }
        break;
        case "TOPIC":
            addMessage(params[2],colorize(userhost[0])+" has changed the topic to: "+message);
            var chan = gettarget(params[2]);
            chan.chanstuff.topic.innerHTML = message;
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
            socket.onStarted();
        break;
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
                    case 'CHANTYPES':
                        irc.chantype = keyval[1];
                    break;
                    case 'NAMESX':
                        raw("protoctl namesx");// /names will send all statuses
                    break;
                    case 'NETWORK':
                        irc.server = keyval[1];                        
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
            chan.chanstuff.topic.innerHTML = message;
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
            updateUsers(chan);//chanstuff.users.sort(userSort);
        break;
        case "433":
            irc.nick += "_";
            raw("NICK "+irc["nick"]);
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
function addMessage(nam,html,hideTime,noCount){
    var p = document.createElement("p");
    var d = new Date();
    if(!hideTime)
        p.innerHTML = "[".concat(timepad(d.getHours()),":",timepad(d.getMinutes()),"] ");
    p.innerHTML += html;
    p.style.margin = "0px";
    p.style.fontSize = "12px";
    var target = gettarget(nam);
    var output = target.chanstuff["output"];
    var willScroll = (output.clientHeight+output.scrollTop >= output.scrollHeight);
    output.appendChild(p);
    if(willScroll) output.scrollTop = output.scrollHeight-output.clientHeight;
    if(!!noCount) return;
    if((currentwin!=target.cont)||(currentwin.style.visibility=="hidden")){
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
window.mirc_colors = ["#ffffff", "#000000", "#000088", "#008800", "#ff0000", "#A52A2A", "#880088", "#ff8800", "#ffff00", "#00ff00", "#008888", "#00ffff", "#0000ff", "#ff00ff", "#888888", "#cccccc","#ffffff", "#000000", "#000088", "#008800", "#ff0000", "#A52A2A", "#880088", "#ff8800", "#ffff00", "#00ff00", "#008888", "#00ffff", "#0000ff", "#ff00ff", "#888888", "#cccccc"];
window.colorcheck = {"#ffffff":"", "#000000":"", "#000088":"", "#008800":"", "#ff0000":"", "#A52A2A":"", "#880088":"", "#ff8800":"", "#ffff00":"", "#00ff00":"", "#008888":"", "#00ffff":"", "#0000ff":"", "#ff00ff":"", "#888888":"", "#cccccc":""}
function irc2html(irctext){
    //return irctext;
    var irctext = irctext.split("");
    var c = "";
    var bold = false;
    var underline = false;
    var reverses = false;
    var font = {"on":false,"fg0":-1,"fg1":-1,"bg0":-1,"bg1":-1,"fg":-1,"bg":-1};
    //console.log(irctext);
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

    irctext = irctext.replace(/(http:\/\/[^ <>"']+)/gi,urlLinkFunc).replace(/(#[^ ;@!><"]+)/gi,chanLink);
    
    for(var smil in smilies){
        irctext = irctext.replace(smilies[smil][0],smilies[smil][1]);
    }
    return irctext;
}
window.urlLinkFunc = function(str){
return "<a href='"+str+"' target='_blank' style='color:#888'>"+str+"</a>";
}
window.chanLink = function(str){
if(str in colorcheck) return str;
return "<a href='irc://"+irc.serverlink+"/"+str+"' onclick='raw(\"join "+str+"\");return false;' title='Click to join "+str+"' style='color:#888'>"+str+"</a>";
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
window.is_chan = function(nam){
return !!(nam.substring(0,1)==irc.chantype);
}
window.chanNameCmp = function(a, b) {
var A = a["name"].toLowerCase();
var B = b["name"].toLowerCase();
if (A < B) {return -1}
if (A > B) {return 1}
return 0;
}
window.chanUsersCmp = function(a, b) {
var A = parseInt(a["users"]);
var B = parseInt(b["users"]);
return A-B;
}
window.sortChanListName = function(){
    var target = gettarget("Channels List");
    clearlines(target);
    irc.channellist.sort(chanNameCmp);
    for(var c in irc.channellist){
        addMessage("Channels List",irc.channellist[c]["name"]+" ("+irc.channellist[c]["users"]+") "+irc2html(irc.channellist[c]["topic"]),true,true);
    }
}
window.sortChanListUser = function(){
    var target = gettarget("Channels List");
    clearlines(target);
    irc.channellist.sort(chanUsersCmp);
    for(var c in irc.channellist){
        addMessage("Channels List",irc.channellist[c]["name"]+" ("+irc.channellist[c]["users"]+") "+irc2html(irc.channellist[c]["topic"]),true,true);
    }
}
window.altermode = function(mode,delta,userBool){
    /* apply delta to mode, ie mode: +ix +r -> +ixr */
    var args = mode.split(" ");
    var deltargs = delta.split(" ");
    var base = args.shift();
    var m = "";
    var plus = true;
    var i = -1;
    for(var b in base){
        m = base.charAt(b);
        if(m=="+"){plus=true;continue;}
        if(m=="-"){plus=false;continue;}
        if(irc.chmodegrps[3].indexOf(m)>=0 || userBool){
            i = base.indexOf(m);
            if(i==-1 && plus) base += m;
        }
    }
    return base+" "+args.join(" ");
}
window.sortStatus = function(a,b){
    return irc["chstatus"].lastIndexOf(a)-irc["chstatus"].lastIndexOf(b);
}







window.ui = {
"color":"#000000",
"titlebg":"blue",
"titlecolor":"white",
"titleheight":"20px",
"winborder":"1px black solid",
"buttonborder":"1px white solid",
"background":"#fff none",
"sepborder":"1px black solid",
};
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
window.tabletters = "";

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
win.style.color = ui["color"];
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

window.adjustui = function(win){
win.titlediv.style.width = win.style.width;
var w = parseInt(win.cont.style.width);
win.closebutton.style.left = w-15+"px";
win.shadebutton.style.left = w-30+"px";
win.onuiupdate(win);
}

window.winsize = function(win,width,height){
win.cont.style.height = height+"px";
win.cont.style.width = width+"px";
adjustui(win);
}

window.shadewin = function(event){
    var tmp = event.target.parentNode;
    if(tmp.cont) currentwin = tmp.cont;
    else currentwin = tmp.parentNode.cont;
    document.body.focus();
    if(currentwin.style.visibility!="hidden"){
        currentwin.style.visibility="hidden";
        currentwin.win.titlediv.style.visibility="visible";
    } else {
        currentwin.style.visibility="visible";
    }
    return false;
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
window.clearlines = function(win){
    while(win.chanstuff.output.childNodes.length){
        win.chanstuff.output.removeChild(win.chanstuff.output.firstChild);
    }
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
topicdiv.appendChild(document.createTextNode("["));
topicdiv.appendChild(chmode);
topicdiv.appendChild(document.createTextNode("] "));
topicdiv.appendChild(topic);
input.style.position = "absolute";
output.style.position = "absolute";
usercont.style.position = "absolute";
topicdiv.style.position = "absolute";
//input.style.border = ui["sepborder"];
output.style.borderRight = ui["sepborder"];
usercont.style.borderLeft = ui["sepborder"];
output.style.borderTop = ui["sepborder"];
usercont.style.borderTop = ui["sepborder"];
//topicdiv.style.border = ui["sepborder"];
usercont.style.width = "75px";
topicdiv.style.top = "18px";
topicdiv.style.height = "18px";
topicdiv.style.overflow = "hidden";
topicdiv.style.fontSize = "12px";
output.style.top = "36px";
output.style.overflowY = "scroll";
output.style.overflowX = "auto";
output.style.paddingBottom = "3px";
usercont.style.top = "36px";
usercont.style.overflow = "scroll";
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
input.focus()
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
topicdiv.style.overflow = "hidden";
topicdiv.style.fontSize = "12px";
output.style.top = "36px";
output.style.width = "100%";
output.style.overflowY = "scroll";
output.style.overflowX = "auto";
output.style.paddingBottom = "3px";
input.style.width = "100%";
input.style.height = "36px";
bind(input,"keydown",inputEvent);

input.sendto = username;
win.chanstuff = {
"output":output,
"input":input,
"scroll":[],
"currentScroll":0,
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
if(target.charAt(0)==irc.chantype)
    return newchanwin(tmp);
return newuserwin(tmp);
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
    addMessage(params[0],colorize(irc.nick)+": "+params.slice(1).join(" "));
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
return sendCommand(data);
}
window.inputEvent = function(event){
    if((event.keyCode==13)&&(!event.shiftKey)){
        var data = event.currentTarget.value;
        event.currentTarget.value = "";
        if(data.charAt(0)=="/") {
            userCommand(data.substring(1),event.currentTarget.sendto);
        } else {
            var lines = data.split("\n");
            while(data = lines.shift()){
                addMessage(event.currentTarget.sendto,colorize(irc["nick"])+": <span style='color:#888;'>"+irc2html(irc.prepend+data)+"</span>");
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
        /*target.chanstuff.currentScroll--;
        if(target.chanstuff.currentScroll<0) target.chanstuff.currentScroll = 0;
        if((target.chanstuff.currentScroll==target.chanstuff.scroll.length-2) &&(event.currentTarget.value)) target.chanstuff.scroll.push(event.currentTarget.value);
        event.currentTarget.value = target.chanstuff.scroll[target.chanstuff.currentScroll];*/
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
        /*target.chanstuff.currentScroll++;
        if(target.chanstuff.currentScroll>=target.chanstuff.scroll.length) target.chanstuff.currentScroll = target.chanstuff.scroll.length-1;
        event.currentTarget.value = target.chanstuff.scroll[target.chanstuff.currentScroll];*/
        event.currentTarget.value = target.chanstuff.scroll[target.chanstuff.currentScroll++];
        if(event.currentTarget.value=="undefined"){event.currentTarget.value = ""; target.chanstuff.currentScroll--;}
        event.preventDefault();
        return false;
    }
    if(event.ctrlKey){//only works in chrome because everything in firefox is already bound
        //console.log(event.keyCode);
        /* Windows users may be able to hit ALT+2 for bold? */
        switch(event.keyCode){
            case 66:
                event.currentTarget.value += String.fromCharCode(2);
                event.preventDefault();
                return false;
            break;
            case 75:
                event.currentTarget.value += String.fromCharCode(3);
                event.preventDefault();
                return false;
            break;
            case 79:
                event.currentTarget.value += String.fromCharCode(0xf);
                event.preventDefault();
                return false;
            break;
            case 82:
                event.currentTarget.value += String.fromCharCode(0x16);
                event.preventDefault();
                return false;
            break;
            case 85:
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
        li.style.whiteSpace = "nowrap";
        li.style.fontSize = "12px";
        li.innerHTML += " "+colorize(win.chanstuff.users[u][0]);
        win.chanstuff.userlist.appendChild(li);
    }
}
window.partChan = function(win){
raw("PART "+win.chanstuff.input.sendto);
}











window.socket = {"test":'f',"var":{}};
window.irc = {"nick":"unknown","chmodegrps":["beI","kfL","lj","psmntirRcOAQKVCuzNSMTG"],"prefix":"qaohv","chstatus":["~&@%+"],"chstatusreg":/([~&@%+]*)(.+)/,"server":"SERVER","serverlink":"irc.somewhere.net","chantype":"#","prepend":""}
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
socket.irc.connect("irc.bitsjointirc.net",6667,"xmlsocket://irc.bitsjointirc.net:8002");
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
socket.onStarted = function(){
return false;
}
socket.close = function(){raw("QUIT");};


window.onload = function(){
pageLoaded();
window.setTimeout(init,1000);
}
window.onunload = socket.close;
window.onbeforeunload = function(event){
	if(!event) event = window.event;
	event.cancelBubble = true;
	event.returnValue = 'If you leave this page, your chat session will end. Are you sure you want to leave this page?';
	if (event.stopPropagation) {
		event.stopPropagation();
		event.preventDefault();
	}
};

window.onblur = function(event){
window.pagefocused = false;
}
window.onfocus = function(event){
window.pagefocused = true;
var dt = document.title.match(/IRC \((\d*)\) (.*)/);
if(dt)
    document.title = dt[2];
}
