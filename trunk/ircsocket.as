package {
	import flash.display.Sprite;
	import flash.events.*;
	import flash.errors.*;
	import flash.net.Socket;
	import flash.utils.ByteArray;
	import flash.system.Security;
	import flash.external.ExternalInterface;
	public class ircsocket extends Sprite{
		public var id:uint = 0;
		public var buffer:String = new String();
		public var bufferArray:Array = new Array();
		public var tmp:String = new String();
		public var maxBytes:uint = 512;
		private var socket:Socket;
		public function ircsocket() {
			ExternalInterface.marshallExceptions = true;
ExternalInterface.call("response","loaded");
			ExternalInterface.addCallback("something",function():void{ExternalInterface.call("response","anything at all");});
			socket = new Socket();
			socket.addEventListener(Event.CLOSE, onClose, false, 0);
			socket.addEventListener(Event.CONNECT, onConnect, false, 0);
			socket.addEventListener(IOErrorEvent.IO_ERROR, onError, false, 0);
			socket.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onSecurityError, false, 0);
			socket.addEventListener(ProgressEvent.SOCKET_DATA, onData, false, 0);
			ExternalInterface.addCallback("connect", _connect);
			ExternalInterface.addCallback("close", _close);
			ExternalInterface.addCallback("send", _send);
			ExternalInterface.addCallback("check", _check);
			ExternalInterface.addCallback("hardtest", _hardtest);
		}
		private function _check():void{
			ExternalInterface.call("response");	
		}
		private function _hardtest():void{
			var n:Number = 2+2;
		}
		private function _connect(host:String, port:int, policy:String):uint{
			Security.loadPolicyFile(policy);//("xmlsocket://irc.pokesplash.net:8002");
			try{
			socket.connect(host, port);
			return 1;
			}catch(error:Error){
ExternalInterface.call("response",error.message);
			}
			return 0;
		}
		
		private function _close():void{
			try{
			socket.close();
			}catch(error:Error){
ExternalInterface.call("response",error.message);
			}
		}
		
		private function _send(string:String):void{
			try{
			var toSend:ByteArray = new ByteArray();
			toSend.writeUTFBytes(string);
			toSend.writeUTFBytes("\r\n");
			socket.writeBytes(toSend);
			socket.flush();
			}catch(error:Error){
ExternalInterface.call("response",error.message);
			}
		}
		
		private function onConnect(event:Event):void{
			ExternalInterface.call("irc_onConnect");
		}
		
		private function onError(event:IOErrorEvent):void{
			ExternalInterface.call("irc_onError", event.text);
		}
		
		private function onSecurityError(event:SecurityErrorEvent):void{
			ExternalInterface.call("irc_onError", event.text);
		}
		
		private function onClose(event:Event):void{
			ExternalInterface.call("irc_onClose");
		}
		private function onData(event:ProgressEvent):void {
			try{
				while(socket.bytesAvailable){
					if (socket.bytesAvailable < maxBytes){
						buffer += socket.readUTFBytes(socket.bytesAvailable);
					} else {
						buffer += socket.readUTFBytes(maxBytes);
					}
				}
				var lines:Array = buffer.split("\r\n");
				buffer = lines.pop();
				for each(var line:String in lines){
				ExternalInterface.call("irc_onData", line);
				}
				socket.flush();
			}
			catch(e:Error){
				ExternalInterface.call("response",e);

			}
		}

	}
}
