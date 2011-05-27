window.blank = function(){
  return true;
};
window.alircAPI= 
  {
    /* connect(server) */
    "connect":[],
    /* message(data) */
    "message":[],
    /* command(command, params) */
    "command":[],
    /* join(channel, userhost) */
    "join":[],
    /* privmsg(target, userhost, message) */
    "privmsg":[],
    /* notice(target, userhost, message) */
    "notice":[],
    /* nick(userhost, newnick) */
    "nick":[],
    /* kick(userhost, target, channel) */
    "kick":[],
    /* part(channel, userhost, message) */
    "part":[],
  };
  
window.callhook = function(hook){
  if(!alircAPI[hook]) return false;
  foreach(alirc[hook] as h){
    alirc[hook][h]();
  }
  return true;
}
window.hook = function(hookname,binding){
  if(!alircAPI[hookname]) return false;
  alirc[hookname].push(binding);
  return true;
}
