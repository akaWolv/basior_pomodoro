var userMenuToggle = function() {

    var $lineTop 	= $('.user-menu-toggle .line-top'),
        $lineMiddle = $('.user-menu-toggle .line-middle'),
        $lineBottom = $('.user-menu-toggle .line-bottom'),
        time 		= 200,
        rotateClass = 'rotate',
        hoverClass	= 'hover';

      $(".user-menu").toggleClass("user-menu-display");
      $(".user-menu").removeClass("hide");
      $(".bg-layer").toggleClass("show");
      $(".display-row").toggleClass("moved");

      if ( $( ".user-menu" ).hasClass( "user-menu-display" ) ) {
          var transitionTop 	 = $lineTop.addClass(hoverClass),
              transitionMiddle = $lineMiddle.addClass(hoverClass),
              transitionBottom = $lineBottom.addClass(hoverClass);

        setTimeout(function() {
            transitionTop.addClass(rotateClass);
            transitionMiddle.addClass(rotateClass);
            transitionBottom.addClass(rotateClass);
        }, time);
    } else {
        var transitionTop 	 = $lineTop.removeClass(rotateClass),
              transitionMiddle = $lineMiddle.removeClass(rotateClass),
              transitionBottom = $lineBottom.removeClass(rotateClass);

        setTimeout(function() {
            transitionTop.removeClass(hoverClass);
            transitionMiddle.removeClass(hoverClass);
            transitionBottom.removeClass(hoverClass);
        }, time);
    }
};

$(document).ready(function () {
    $('[data-toggle="offcanvas"]').click(function () {
        $('.row-offcanvas').toggleClass('active')
    });

    var userMenuHtml = '<div class="line line-top"></div><div class="line line-middle"></div><div class="line line-bottom"></div>',
        userMenuElement = document.getElementById('user-menu-toggle');

    userMenuElement.innerHTML = userMenuHtml;
    userMenuElement.addEventListener('click', userMenuToggle);


});
