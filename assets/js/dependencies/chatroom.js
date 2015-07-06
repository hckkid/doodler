if (document.forms['chatbox']) {
  (function($) {
    /**
    * Declare Variables
    */
    var the_form = document.forms['chatbox'];
    var container = $('#messages_container');
    var roomno = the_form.roomno.value;
    /**
    * Define Functions
    */
    io.socket.post('/room/join', {rand: roomno},
    function (data) {
    });

    var submitChatBox = function () {
      post_data = {
        roomnum: roomno,
        message: the_form.message.value,
      };
      //console.log("So sending");
      io.socket.post('/room/broadcast', post_data,function (data) {});
    };

    io.socket.on('chatmessage',function (data){
      //console.log(data);
      container.prepend(
        '<li class="list-group-item">' +
        '<h5>' + data + '</h5>' +
        '</li>'
      );
    });

    /**
    * Set Event Listeners
    */
    $(the_form).submit( function (event)
    {
      event.preventDefault();
      submitChatBox();
    });
  })(jQuery);
}
