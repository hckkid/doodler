var app = angular.module('rpiapp',[]);

app.controller = app.controller('rpidevices',['$scope',function($scope){
  var cr = this;
  $scope.devices = [];
  //cr.devices = $scope.devices;
  cr.updateRdevices = function(data){
    //console.log(data);
    $scope.devices = data;
    //console.log($scope.devices);
  };
  cr.addRdevice = function(data){
    //console.log(data);
    $scope.devices.push(data);
    //console.log($scope.devices);
  };
  cr.deployMessage = function(device){
    //console.log("Message"+device.message);
    //alert(device.message);
    io.socket.get('/rpimessage',device,function(resData,jwres){
      if(jwres.statusCode == 200)
        alert("Deployed");
    });
  };
  cr.deleteRdevice = function(device){
    var currDevice;
    var devices = [];
    for (currDevice of $scope.devices){
      if(currDevice.id != device.id)
        devices.push(currDevice);
    }
    $scope.devices = devices;
  }
  io.socket.on('newdevice',function(data){
    $scope.$apply(function(){cr.addRdevice(data);});
  });
  io.socket.on('removed',function(data){
    $scope.$apply(function(){cr.deleteRdevice(data);});
  });
  io.socket.get('/watchrpi',{});
  io.socket.get('/rpidevices',function(resData){
    //console.log(resData);
    var devices = [];
    var rdata;
    for(rdata of resData){
      //console.log(rdata);
      devices.push({'id':rdata});
    }
    //console.log()
    $scope.$apply(function(){cr.updateRdevices(devices);});
  });
  // io.socket.on('newdevice',function(data){
  //   $scope.$apply(function(){cr.addRdevice(data)});
  // });
}]);

// var updateRdevices = function(data){
//   rdevices = data;
// }

var rdevices = [];
