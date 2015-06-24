$(document).ready(function () {
    $('[data-toggle="offcanvas"]').click(function () {
        $('.row-offcanvas').toggleClass('active')
    });

    var $lineTop 	= $('.user-menu-toggle .line-top'),
    	$lineMiddle = $('.user-menu-toggle .line-middle'),
    	$lineBottom = $('.user-menu-toggle .line-bottom'),
    	time 		= 200,
    	rotateClass = 'rotate',
    	hoverClass	= 'hover';

    $(".user-menu-toggle").click(function() {

  		$(".user-menu").toggleClass("user-menu-display");
  		$(".user-menu").removeClass("hide");
  		$(".bg-layer").toggleClass("show");

  		if ( $( ".user-menu" ).hasClass( "user-menu-display" ) ) {

  			var transitionTop 	 = $lineTop.addClass(hoverClass),
  				transitionMiddle = $lineMiddle.addClass(hoverClass),
  				transitionBottom = $lineBottom.addClass(hoverClass);

			setTimeout(function() {
				transitionTop.addClass(rotateClass);
			}, time);
			setTimeout(function() {
				transitionMiddle.addClass(rotateClass);
			}, time);
			setTimeout(function() {
				transitionBottom.addClass(rotateClass);
			}, time);

		} else {

			var transitionTop 	 = $lineTop.removeClass(rotateClass),
  				transitionMiddle = $lineMiddle.removeClass(rotateClass),
  				transitionBottom = $lineBottom.removeClass(rotateClass);

			setTimeout(function() {
				transitionTop.removeClass(hoverClass);
			}, time);
			setTimeout(function() {
				transitionMiddle.removeClass(hoverClass);
			}, time);
			setTimeout(function() {
				transitionBottom.removeClass(hoverClass);
			}, time);
		}

	});

});