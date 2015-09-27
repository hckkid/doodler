module.exports = {
  'join':function(req, res, next){
		// sails.sockets.broadcast(req.param("rand"),'joining',{id:req.socket.id});
		// sails.sockets.join(req.socket, req.param("rand"));
		//console.log("Join"+req.socket.id);
		//res.send({roomno: req.param("rand")});
    if(req.socket.id){
      sails.sockets.join(req.socket,'rpidevices');
      sails.sockets.broadcast('rpiwatchers','newdevice',{'id':req.socket.id});
      res.ok();
    }
	},
  'devices':function(req,res,next){
    res.send(sails.sockets.subscribers('rpidevices'));
  },
  'deploy':function(req,res,next){
    sails.sockets.emit(req.param('id'),'deployedMessage',req.param('message'));
    res.ok();
  },
  'disconnect':function(socket){
    //console.log("Disconnected "+socket.id);
    sails.sockets.broadcast('rpiwatchers','removed',{'id':socket.id});
  },
  'watcher':function(req,res,next){
    sails.sockets.join(req.socket,'rpiwatchers');
  }
}
