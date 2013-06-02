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
            var natWidth  = tmpImg.width;
            var natHeight = tmpImg.height;
            var fCanvW = $('.front').find('canvas').attr('width');
            var fCanvH = $('.front').find('canvas').attr('height');
            var bCanvW = $('#background').find('canvas').attr('width');
            var bCanvH = $('#background').find('canvas').attr('height');
            var fOpts  = {'dx': 0, 'dy': 0, 'dw': 0, 'dh':0};
            var bOpts  = {'dx': 0, 'dy': 0, 'dw': 0, 'dh':0};
            
            // 補正情報の計算
            // キャンバスアスペクト比による補正
            if ((bCanvH / bCanvW) <= 1.0){
                console.log('width priority');
                // virtural Background Height
                var vbHeight = natHeight * (bCanvW/natWidth);
                var vfHeight = natHeight * (fCanvW/natWidth);                
                bOpts.dy = ((vbHeight - bCanvH) / 2.0) * -1.0;
                bOpts.dw = bCanvW;
                bOpts.dh = vbHeight;
                fOpts.dy = ((vbHeight - fCanvH) / 2.0) * -1.0;
                fOpts.dw = fCanvW;
                fOpts.dh = vfHeight;
            }else{
                console.log('height priority');
                var vbWidth = natWidth * (bCanvW/natWidth);
                var vfWidth = natHeight * (fCanvW/natWidth);
                bOpts.dx = ((vbWidth - bCanvW) / 2.0) * -1.0;
                bOpts.dw = vbWidth;
                bOpts.dh = bCanvW;
                fOpts.dx = ((vfWidth - fCanvW) / 2.0) * -1.0;
                fOpts.dw = vfWidth;
                fOpts.dh = fCanvW;
            };

            console.log(fOpts.dx+', '+fOpts.dy+', '+fOpts.dw+', '+fOpts.dh);
            console.log(bOpts.dx+', '+bOpts.dy+', '+bOpts.dw+', '+bOpts.dh);
            
            var ctx  = $('.front').find('canvas')[0].getContext('2d');
            var ctxb = $('#background').find('[data-canvas-id=' + currCanvasId +']')[0].getContext('2d');

            // FIXME: 最適なサイズに
            ctx.clearRect( 0, 0, fCanvW, fCanvH);
            ctxb.clearRect(0, 0, bCanvW, fCanvH);
            ctx.drawImage( tmpImg, fOpts.dx, fOpts.dy, fOpts.dw, fOpts.dh);
            ctxb.drawImage(tmpImg, bOpts.dx, bOpts.dy, bOpts.dw, bOpts.dh);
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

                    // ImageResize
                    $.canvasResize(sendFile, {
                        width: 1200,
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
    

    var bgCtrl = (function(){
        var cid = 0;
        var global = {
            next: (function(){
                cid = cid + 1;
                if(cid >= 7){ cid = 0; }
                $('#background').find('canvas').css({'left' : $(window).width()});
                $('#background').find('[data-canvas-id="' + cid +'"]').css({'left' : 0});
                
            }),
            getCid: (function(){
                return cid;
            })
        };
        return global;
    })();
    
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

        setInterval(function(){
            bgCtrl.next();
        }, 100);
    });
})();