(function(){
    var SocketCtrl = (function(){
        var socket = io.connect();
        socket.binaryType = 'blob';
        var appendto = 'body';
        var tmpImg = new Image();
        var canvases = $('canvas');
        var currCanvasId = 0;

        // ロード時の描画処理
        // 画像のサイズ調整・位置調整はここでする
        $(tmpImg).bind('load', function(){
            var ctx  = $('.front').find('[data-canvas-id=' + currCanvasId +']')[0].getContext('2d');
            var ctxb = $('#background').find('[data-canvas-id=' + currCanvasId +']')[0].getContext('2d');

            // FIXME: 最適なサイズに
            ctx.clearRect(0, 0, 1000, 1000);
            ctxb.clearRect(0, 0, 1000, 1000);
            ctx.drawImage(tmpImg, 0, 0);
            ctxb.drawImage(tmpImg, 0, 0);
            currCanvasId = (currCanvasId + 1) % 7;
        });

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
                    console.log('fr.onload :' + (new Date()).getTime());
                    $.canvasResize(sendFile, {
                        width: 1600,
                        height: 0,
                        crop: false,
                        quality: 67,
                        //rotate: 90,
                        callback: function(dataUrl, width, height) {
                            console.log(dataUrl.length);
                            data.file = dataUrl;
                            data.type = sendFile.type;
                            data.size = data.file.length;
                            console.log(data.file.length);
                            socket.emit('upload', data);
                        }
                    });
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

            imgUploader.upload(files[0]);
            console.log('drop :' +(new Date()).getTime());
        });
    });

    var windowResize = function(e){
        // canvasサイズの設定
        var width  = $(window).width();
        var height = $(window).height();
        var innerWidth  = $('.front').width();
        var innerHeight = $('.front').width() * (height/width);
        console.log(innerWidth + 'x' + innerHeight);
        $('.front-canvas').attr({'width':  width,
                                 'height':  height});
        $('.front-canvas').css({'width':  innerWidth,
                                 'height':  innerHeight});

        $('#background').find('canvas').attr({'width':  width,
                                              'height':  height});
        $('#background').find('canvas').css({'width':  width,
                                              'height':  height});
        
    };
    

    $(document).ready(function(){
        var logosrc = '/images/logo'+ Math.floor( Math.random() * 6 ) + '.jpg';
        $('h1').find('#logo').attr({'src': logosrc});
        // for File API
        jQuery.event.props.push('dataTransfer');
        windowResize();
        var socket = SocketCtrl();
        var dropbox = Dropbox(socket);
        $(window).resize(function(e){
            console.log('resize');
            windowResize(e);
        });
    });
})();