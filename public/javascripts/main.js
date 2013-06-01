(function(){
    var SocketCtrl = (function(){
        var socket = io.connect();
        var appendto = 'body';
        var tmpImg = new Image();
        var canvases = $('canvas');
        var currCanvasId = 0;

        $(tmpImg).bind('load', function(){
            var ctx = $('canvas')[currCanvasId].getContext('2d');
            ctx.drawImage(tmpImg, 0, 0);
            currCanvasId = (currCanvasId + 1) % 5;            
        });

        socket.binaryType = 'blob';
        socket.on('uploaded', function(data){
            tmpImg.src = data.file;
            console.log('receive image!');
        });

        var global = {
            upload: (function(sendFile){
                var fileReader = new FileReader();
                var data = {};
                
                fileReader.readAsDataURL(sendFile);
                fileReader.onload = (function(e){
                    data.file = e.target.result;
                    data.type = sendFile.type;
                    data.size = sendFile.size;
                    console.log(data);
                    socket.emit('upload', data);
                });
            })
        };

        return global;
    });
    
    var Dropbox = (function(imgUploader){
        var dropbox = $('#dropbox');
        dropbox.bind('dragenter', function(e){
            e.stopPropagation();
            e.preventDefault();
            console.log('dragenter');
        });
        dropbox.bind('dragover', function(e){
            e.stopPropagation();
            e.preventDefault();
            console.log('dragover!!');
        });
        dropbox.bind('drop', function(e){
            e.stopPropagation();
            e.preventDefault();

            var dt = e.dataTransfer;
            var files = dt.files;
            console.log(files.length);

            for(var i = 0; i < files.length; i++){
                imgUploader.upload(files[i]);
            }
        });
    });

    // var Socket = (function(){
    //     var socket = io.connect();
    //     socket.on('posted', function(data){
    //         console.log(data);
    //         $('#log').append('<li>' + data.message.body + '</li>');
    //     });
    //     $('#send').on('click', function(){
    //         var msg = {body : $('#msg').val()}
    //         socket.emit('post', msg);
    //         $('#msg').val('');
    //     });
    //     var global = {

    //     };
    //     return global;
    // });

    $(document).ready(function(){
        // for File API
        jQuery.event.props.push('dataTransfer');
        var socket = SocketCtrl();
        var dropbox = Dropbox(socket);
    });
})();