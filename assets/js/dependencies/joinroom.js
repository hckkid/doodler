if (document.forms['join_form']) {
  (function($) {
    /**
    * Declare Variables
    */
    var the_form = document.forms['join_form'];
    /**
    * Define Functions
    */
    var submitJoinRoom = function () {
      post_data = {
        rand: the_form.roomno.value,
      };
      //console.log("So good");
      window.location = '/room/show?rand=' + post_data.rand;
    };

    /**
    * Set Event Listeners
    */
    $(the_form).submit( function (event)
    {
      event.preventDefault();
      submitJoinRoom();
    });
  })(jQuery);
}
