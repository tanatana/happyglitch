$(document).ready(function(){
    var socket = io.connect();
    socket.on('posted', function(data){
        console.log(data);
        $('#log').append('<li>' + data.message.body + '</li>');
    });

    $('#send').on('click', function(){
        var msg = {body : $('#msg').val()}
        socket.emit('post', msg);
        $('#msg').val('');

    })
});
        
