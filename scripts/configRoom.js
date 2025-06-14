$(document).ready(function () {
    $('.mobile-btn').on('click', function () {
        $('#sidebar-mobile').toggleClass('active');
        $('#container-main').toggleClass('active');
    });
});