// ==UserScript==
// @name         Swusana
// @namespace    http://tampermonkey.net/
// @version      0.14.4
// @description  Asana Productivity Enhancements including - Noise Reduction.  Blackout periods.  Timer
// @author       will@sendwithus.com
// @match        https://app.asana.com/*
// @grant        GM_xmlhttpRequest
// @updateURL    https://github.com/sendwithus/swusana/blob/master/swusana.user.js
// @downloadURL  https://github.com/sendwithus/swusana/blob/master/swusana.user.js
// @require http://code.jquery.com/jquery-1.12.4.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.0/js.cookie.min.js
// ==/UserScript==

// TODO create some better buttons
var imageButton = $('<a id="imageButton" title="add image" class="NavigationLink Topbar-imageButton swusana-button" href="javascript:;"><img height="24" src="https://cdn2.iconfinder.com/data/icons/media-and-navigation-buttons-round/512/Button_16-512.png"></a>')
var noiseButton = $('<a id="noiseButton" title="hide/show noise" class="NavigationLink Topbar-noiseButton swusana-button" href="javascript:;"><img height="24" src="https://icon-rainbow.com/i/icon_00671/icon_006710_256.png"></a>');
var blackoutButton = $('<a id="blackoutButton" title="turn on/off blackout period" class="NavigationLink Topbar-blackoutButton swusana-button" href="javascript:;"><img height="24" src="http://cdn.onlinewebfonts.com/svg/img_314578.png"></a>');
var timerButton = $('<a id="timerButton" title="time how long you are looking at a task" class="NavigationLink Topbar-timerButton swusana-button" href="javascript:;"><img height="24" src="https://www.freeiconspng.com/uploads/timer-icon-15.png"></a><div id="swusana-timer" style="display:none" class="swusana-timer"></div>');
var noiseButtonOn = false;
var blackoutButtonOn = false;
var imageButtonOn = false;
var timerButtonOn = false;
var blackoutProfileStyle = '';
var timer = 0;

var waitForEl = function(selector, callback) {
  if (jQuery(selector).length) {
    callback();
  } else {
    setTimeout(function() {
      waitForEl(selector, callback);
    }, 100);
  }
};

// ONLOAD
var buttonBarLocation = '.TopbarHelpMenuButton-button';
$(document).ready(function(){
    waitForEl(buttonBarLocation, function(){
        $(buttonBarLocation).after(timerButton);
        $(buttonBarLocation).after(imageButton);
        $(buttonBarLocation).after(blackoutButton);
        $(buttonBarLocation).after(noiseButton);
        blackoutProfileStyle = $('.TopbarPageHeaderGlobalActions .AvatarPhoto').attr('style');

        $('.TopbarContingentUpgradeButton-link').hide();

        // TIMER TRIGGERS
        $('#timerButton').on('click', function(){
            timerButtonOn = !timerButtonOn;
            $(this).toggleClass('swusana-button-on');
            Cookies.set('timerButtonStatus', timerButtonOn, { expires: 365 });
            if (timerButtonOn) {
                $('#swusana-timer').show();
            } else {
                $('#swusana-timer').hide();
            }
        });

        if (Cookies.get('timerButtonStatus') === 'true'){
            $('#timerButton').trigger('click');
        }

        // IMAGE TRIGGERS
        $('#imageButton').on('click', function(){
            imageButtonOn = !imageButtonOn;
            $(this).toggleClass('swusana-button-on');
            Cookies.set('imageButtonStatus', imageButtonOn, { expires: 365 });
            var currentBackgroundImage = Cookies.get('currentBackgroundImage');
            if (imageButtonOn) {
                var newImage = prompt('Enter an image URL', currentBackgroundImage);
                $('.ProjectPage').css('opacity', '0.85');
                $('#asana_main').css('background-image', 'url(' + newImage + ')').css('background-repeat','no-repeat').css('background-size','110%').addClass('themeBackground-aqua');
                Cookies.set('currentBackgroundImage', newImage, { expires: 365 });
            } else {
                $('#asana_main').css('background-image', '')
            }
        });

        if (Cookies.get('imageButtonStatus') === 'true'){
            $('#imageButton').toggleClass('swusana-button-on');
            var newImage = Cookies.get('currentBackgroundImage');
            $('.ProjectPage').css('opacity', '0.85');
            $('#asana_main').css('background-image', 'url(' + newImage + ')').css('background-repeat','no-repeat').css('background-size','110%').addClass('themeBackground-aqua');;
            imageButtonOn = true;
        }

        // BLACKOUT TRIGGERS
        $('#blackoutButton').on('click', function(){
            blackoutButtonOn = !blackoutButtonOn;
            $(this).toggleClass('swusana-button-on');
            Cookies.set('blackoutButtonStatus', blackoutButtonOn, { expires: 365 });
            if (blackoutButtonOn) {
                var confirmed = confirm('Please carefully confirm.  Blackout is about to be turned on and you will be auto-unfollowed on every task you click on.\n\nClick OK to turn on.\nClick Cancel to turn off.');
                if (!confirmed){
                    blackoutButtonOn = !blackoutButtonOn;
                    Cookies.set('blackoutButtonStatus', blackoutButtonOn, { expires: 365 });
                    $(this).toggleClass('swusana-button-on');
                } else {
                    $('#blackoutButton img').attr('src', 'https://media.giphy.com/media/79VehauAiiSLS/giphy.gif');
                }
            } else {
                $('#blackoutButton img').attr('src', 'http://cdn.onlinewebfonts.com/svg/img_314578.png');
            }
        });

        if (Cookies.get('blackoutButtonStatus') === 'true'){
            $('#blackoutButton').trigger('click');
        }

        // NOISE TRIGGERS
        $('#noiseButton').on('click', function(){
            noiseButtonOn = !noiseButtonOn;
            $(this).toggleClass('swusana-button-on');
            Cookies.set('noiseButtonStatus', noiseButtonOn, { expires: 365 });
            $('.lunaui-grid-center-pane-container#center_pane_container').css({ 'max-width': '1000px !important'});
            if (!noiseButtonOn){
                $('.lunaui-grid-center-pane-container#center_pane_container').css({ 'max-width': '100% !important'});
                $('.swusana-noise').show();
                $('.swusana-noise').removeClass('swusana-noise-hidden');
            }
        });

        if (Cookies.get('noiseButtonStatus') === 'true'){
            $('#noiseButton').trigger('click');
        }


    });
});

// EVENT LOOPS
var target = document.querySelector('#asana_main');
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function(mutations, observer) {
    mutations.forEach(function(mutation) {

        if (mutation.addedNodes) {
            mutation.addedNodes.forEach(function(m){
                if (m.classList && (m.classList.contains('SingleTaskPane') || m.classList.contains('PotListPage-detailsPane'))){
                    timer = new Date().getTime();
                    updateCustomFields();
                }
            });
        }
    });
});

function updateCustomFields(){
    if (noiseButtonOn){
        var customFields = [];

        waitForEl('.CustomPropertyDetailsContainer-row', function(){
            $('.CustomPropertyDetailsContainer-row').each(function(i, item){
                customFields.push($(item).detach());
            });
            customFields.sort(function(a, b){
                var aName = $(a, 'label').text();
                var bName = $(b, 'label').text();
                return aName.localeCompare(bName);
            });
            for (var i = 0; i < customFields.length; i++){
                $('.CustomPropertyDetailsContainer-table').append(customFields[i]);
            }
        });
    }
}

observer.observe(target, {
    subtree: true,
    childList: true
});

setInterval(function() {
    // blackout loop
    if (blackoutButtonOn) {
        $('.RemovableAvatar .AvatarPhoto').each(function(index,item){
            var followStyle = $(item).attr('style');
            console.log(blackoutProfileStyle.startsWith(followStyle.substring(0, followStyle.length - 13)))
            if(blackoutProfileStyle.startsWith(followStyle.substring(0, followStyle.length - 13))) {
                $('.ToggleFollowButton-toggleText').trigger('click');
            }
        });
    }

    // Noise hiding loop
    if (noiseButtonOn) {
        $('.TaskStoryFeed-miniStory, .TaskList .MiniHeartButton, .TaskStoryFeed-separator').not('.StoryFeed-topSeparator, .swusana-noise-hidden, .swusana-always-ignore').each(function(index,item){
            if ($(item).text().indexOf(' created ') !== -1 || $(item).text().indexOf(' duplicated ') !== -1) {
                $(item).addClass('swusana-always-ignore');
            } else {
                $(item).addClass('swusana-noise');
                $(item).addClass('swusana-noise-hidden');
                $(item).hide();
            }
        });
    }

    if (timerButtonOn){
        var duration = parseInt((new Date().getTime() - timer)/1000);
        var date = new Date(null);
        date.setSeconds(duration); // specify value for SECONDS here
        var timeString = date.toISOString().substr(15, 4);
        $('#swusana-timer').html(timeString).css('background-color', duration < 30 ? '#b1f5b1' : duration < 60 ? '#eff953' : '#ff7e7e');
    }
}, 250);


function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

// STYLE
var css =
    '.lunaui-grid-center-pane-container#center_pane_container { max-width: 100% !important}' +
    '.swusana-button { '+
        'margin-left: 8px;' +
        'margin-bottom: -4px;' +
        'opacity: 0.7' +
    '}' +
    '.swusana-button:hover { '+
        'opacity: 1;' +
    '}' +
    '.StoryFeed-miniStory+.StoryFeed-blockStory { margin-top: 0 !important; }' +
    '.swusana-button-on { '+
        'border-bottom: 3px solid #AAAAAA;' +
        'opacity: 1' +
    '}' +
    '.swusana-timer { margin-left: 6px;'+
      'background-color: #b1f5b1;'+
      'padding: 5px;'+
      'border-radius: 8px;'+
      'width: 28px;'+
      'border: 2px solid #555555;'+
    '}';
addGlobalStyle(css);
