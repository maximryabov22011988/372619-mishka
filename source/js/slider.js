/*  -----------------------------------------------------------------------------------
                                       Slider
-------------------------------------------------------------------------------------*/
(function() {

  var isTrue;
  isTrue = document.querySelector('.slider');

  if (isTrue) { // Для работы слайдера только на главной
    var slideNow = 1;
    var sliderList = document.querySelector('.reviews__list');
    var slideCount = document.querySelector('.reviews__list').children.length;
    var next = document.querySelector('.slider__next');
    var prev = document.querySelector('.slider__prev');

    document.addEventListener('DOMContentLoaded', function() {

      function nextSlide() {
        if (slideNow === slideCount || slideNow <= 0 || slideNow > slideCount) {
          sliderList.style.transform = 'translate(0, 0)';
          slideNow = 1;
        } else {
          translateWidth = -document.querySelector('.slider__viewport').offsetWidth * slideNow;
          sliderList.style.transform = 'translate(' + translateWidth + 'px, 0)';
          slideNow++;
        }
      }

      function prevSlide() {
        if (slideNow === 1 || slideNow <= 0 || slideNow > slideCount) {
          translateWidth = -document.querySelector('.slider__viewport').offsetWidth * (slideCount - 1);
          sliderList.style.transform = 'translate(' + translateWidth + 'px, 0)';
          slideNow = slideCount;
        } else {
          translateWidth = -document.querySelector('.slider__viewport').offsetWidth * (slideNow - 2);
          sliderList.style.transform = 'translate(' + translateWidth + 'px, 0)';
          slideNow--;
        }
      }

      next.addEventListener('click', nextSlide, false);
      prev.addEventListener('click', prevSlide, false);

    });
  }

})();
