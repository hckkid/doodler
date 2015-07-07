/**
 * RoomController
 *
 * @description :: Server-side logic for managing rooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	join: function(req, res, next){
		sails.sockets.join(req.socket, req.param("rand"));
		//console.log(sails.sockets.subscribers(req.param("rand")));
		res.send({roomno: req.param("rand")});
	},
	show: function(req, res, next){
		res.view({roomno: req.param('rand')});
	},
	broadcast: function(req,res,next){
		var room = req.param("roomnum");
		var msg = req.param("message");
		//console.log(sails.sockets.subscribers(room));
		sails.sockets.broadcast(room,'chatmessage',msg);
	},
	dummy: function(req,res,next){
		console.log("Dummy Testing");
		sails.sockets.emit(req.socket,'message',"dummyMessage");
	},
	message: function(req,res,next){
		console.log("A Message");
		sails.sockets.broadcast(req.param("roomno"),'message',req.param("data"),req.socket);
	}
};
