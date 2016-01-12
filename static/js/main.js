$(function(){
    var MORNING = [
        'Good morning!',
        'Morgen',
        'Ni zao',
        'Ohayo',
        'Buenos dias',
        'Bonjour',
        'Hi sunshine, the earth says hi'
    ];
    var DAY = [
        'Well hello!',
        'Why hello there.',
        'Hello',
        'Yo.',
        'Greetings!',
    ];
    var EVENING = DAY;
    var NIGHT = [
        'Good night',
        'Gute nacht',
        'Bonne nuit',
        'Hey you!',
        'Sweet sight, good night!',
        'The day is over, the night has come.'
    ]
    var STILL_AWAKE = [
        'Still awake?',
        'Have sweet dreams',
        'Huh, party hard?'
    ]

    var choice = function(arr) {
        return arr[Math.round(Math.random() * (arr.length-1))];
    };
    var changeText = function($selector, arr) {
        var lastChange = $selector.data('lastChange');
        if (lastChange == null || (Date.now()-lastChange) > 3600*1000) {
            console.log(lastChange);
            $selector.data('lastChange', Date.now());
            $selector.text(choice(arr));
        }
    };
    var mod = function(n, m) {
        return (n + m) % m;
    }
    var padding = function(str) {
        if ((''+str).length == 1) return '0'+str;
        else return str;
    };
    var updateTime = function(){
        var date = new Date();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        //hours = seconds % 24;

        $('.slide-welcome').removeClass('morning morning10 day evening night supernight');
        if (hours >= 6 && hours < 10) {
            $('.slide-welcome').addClass('morning');
            changeText($('.js-welcome-text'), MORNING);
        }
        else if (hours >= 10 && hours < 12) {
            $('.slide-welcome').addClass('morning10');
            changeText($('.js-welcome-text'), MORNING);
        }
        else if (hours >= 12 && hours < 17) {
            $('.slide-welcome').addClass('day');
            changeText($('.js-welcome-text'), DAY);
        }
        else if (hours >= 17 && hours < 20) {
            $('.slide-welcome').addClass('evening');
            changeText($('.js-welcome-text'), EVENING);
        }
        else if (hours >= 20 && hours < 24) {
            $('.slide-welcome').addClass('night');
            changeText($('.js-welcome-text'), NIGHT);
        }
        else {
            $('.slide-welcome').addClass('supernight');
            changeText($('.js-welcome-text'), STILL_AWAKE);
        }

        $('.js-clock').text(padding(hours) + ':' + padding(minutes) + ':' + padding(seconds));
        $('.js-date').text(date.getDate()+'.'+(date.getMonth()+1)+'.'+date.getFullYear());
        setTimeout(updateTime, 1000);
    };
    var updateWeather = function(){
        $.getJSON(
            '/weather'
        ).success(function(data){
            console.log();
            var icon = data.weather[0].icon;
            var temperature = Math.round((data.main.temp - 273.15)*10)/10;
            $('.js-weather').text(temperature);
            $('#js-weather-icon').attr(
                'src',
                'http://openweathermap.org/img/w/' + icon + '.png'
            );
            $('.js-weather-desc').text(
                data.weather[0].main
            )
            setTimeout(function(){
                updateWeather();
            }, 1000*60*15);
        }).error(function(err){
            $('#update-container').text(err);
        });
    };
    var updateDeadline = function(){
      var $deadlineTimer = $('#js-next-deadline');
      var $deadlineTimerText = $('#js-next-deadline-text');

      var deadlines = [
        [new Date(2016, 1, 14), 'V1-palautus'],
        [new Date(2016, 1, 28), 'V2-palautus'],
        [new Date(2016, 2, 28), 'V3-palautus'],
        [new Date(2016, 3, 17), 'lopullinen V4-palautus']
      ];
      var lol = 0;

      for (var deadline of deadlines) {
        var daysLeft = Math.round((deadline[0] - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0) {
          $deadlineTimer.text(daysLeft);
          $deadlineTimerText.text(deadline[1]);
          break;
        }
      }
    };

    var updateRoutes = function(){
        $('#update-container').load('/routes');
        setTimeout(function(){
            updateRoutes();
        }, 1000*60*5);
    };
    var howOften = 20*1000;
    var slideCounter = 0;
    var lastSwitch = 0;
    var updateSlides = function(){
        lastSwitch = Date.now();
        slideCounter += 1;
        var i = slideCounter;
        var slideCount = $('.slide').length
        var previousSlide = mod(i-1, slideCount);
        var activeSlide = i%slideCount;
        $('.slide'+previousSlide).css('opacity', 0).css('z-index', 10);
        $('.slide'+activeSlide).css('opacity', 1).css('z-index', 11);
    };
    $('html').on('click', function(e){
        updateSlides();
    });
    setInterval(function(){
        if ((Date.now() - lastSwitch) > howOften) {
            lastSwitch = Date.now();
            updateSlides();
        }
    }, 1000);
    setInterval(updateDeadline, 1000);

    // TODO: ruokalistat


    $('.slide').css('opacity', 0);
    updateRoutes();
    updateWeather();
    updateTime();
    updateSlides();
});
