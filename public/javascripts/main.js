(function(){
    var SocketCtrl = (function(){
        var socket = io.connect();
        socket.binaryType = 'blob';
        var appendto = 'body';
        var canvasNum = 7
        // キャンバス描画に使うtmpImg(documentにはappendされない)
        var tmpImg = [];
        for(var i = 0; i < canvasNum; i++){
            tmpImg[i] = new Image();
        };
        var canvases = $('canvas');
        var currCanvasId = 0;
        var currImgId =    0;

        // ロード時の描画処理
        // 画像のサイズ調整・位置調整はここでする
        for(var i = 0; i < canvasNum - 1; i++){
            $(tmpImg[i]).bind('load', function(e){
                console.log(e);
                var imgId = $(e.target).attr('data-id');
                var natWidth  = e.target.naturalWidth;
                var natHeight = e.target.naturalHeight;
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
                    var vbWidth = natWidth * (bCanvH/natHeight);
                    var vfWidth = natWidth * (fCanvH/natHeight);
                    bOpts.dx = ((vbWidth - bCanvW) / 2.0) * -1.0;
                    bOpts.dw = vbWidth;
                    bOpts.dh = bCanvH;
                    fOpts.dx = ((vfWidth - fCanvW) / 2.0) * -1.0;
                    fOpts.dw = vfWidth;
                    fOpts.dh = fCanvH;
                };

                console.log(fOpts.dx+', '+fOpts.dy+', '+fOpts.dw+', '+fOpts.dh);
                console.log(bOpts.dx+', '+bOpts.dy+', '+bOpts.dw+', '+bOpts.dh);
                
                var ctx  = $('.front').find('canvas')[0].getContext('2d');
                var ctxb = $('#background').find('[data-canvas-id=' + imgId +']')[0].getContext('2d');

                // FIXME: 最適なサイズに
                ctx.clearRect( 0, 0, fCanvW, fCanvH);
                ctxb.clearRect(0, 0, bCanvW, fCanvH);
                ctx.drawImage (tmpImg[currImgId], fOpts.dx, fOpts.dy, fOpts.dw, fOpts.dh);
                ctxb.drawImage(e.target, bOpts.dx, bOpts.dy, bOpts.dw, bOpts.dh);

                $('.loading').css({'display':'none'});
            });
        };

        socket.on('uploaded', function(data){
            tmpImg[data.id].src = data.file;
            $(tmpImg).attr({'data-id': data.id});
            currImgId = data.id;
        });
        
        socket.on('assets', function(data){
            console.log('recieve ASSETS');
            console.log(data);
            for(var i = 0 ; i< data['images'].length; i++){
                tmpImg[i].src = data['images'][i];
                $(tmpImg[i]).attr({'data-id': i});
                currImgId = data['currImgId'];
            }
        });

        var global = {
            upload: (function(sendFile){
                $('.loading').css({'display':'block'});

                var fileReader = new FileReader();
                var data = {};
                fileReader.readAsDataURL(sendFile);
                fileReader.onload = (function(e){
                    console.log('fr.onload :' + (new Date()).getTime());
                    if(sendFile.type != "image/jpeg"){
                        alert('please selet jpeg image!');
                    }else{
                        // ImageResize
                        $.canvasResize(sendFile, {
                            width: 1024,
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
                    }
                });
            }),
            assetsRqst: (function(){
                console.log('ASSETS RQST');
                socket.emit('assets-rqst', {});
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
            $('#drophere').css({'display': 'block'});
        });
        dropbox.bind('dragover', function(e){
            e.stopPropagation();
            e.preventDefault();
            console.log('dragover!!');
        });
        dropbox.bind('drop', function(e){
            e.stopPropagation();
            e.preventDefault();
            $('#drophere').css({'display': 'none'});

            var dt = e.dataTransfer;
            var files = dt.files;
            console.log(files.length);

            imgUploader.upload(files[0]);
            $('.loading').css({'display':'block'});
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
        $('#drophere').css({'width':  innerWidth,
                            'height':  innerHeight});
        
    };
    
    var bgCtrl = (function(){
        var cid = 0;
        var width = $(window).width();
        var global = {
            next: (function(){
                cid = cid + 1;
                if(cid >= 7){ cid = 0; }
                $('#background').find('canvas').css({
                    'transform': 'translateX('+width*2+'px)'
                });
                $('#background').find('[data-canvas-id="' + cid +'"]').css({
                    'transform': 'translateX(0px)'
                });
                
            }),
            getCid: (function(){
                return cid;
            })
        };
        return global;
    })();
    
    $(document).ready(function(){
        var logosrc = '/images/logo'+ Math.floor( Math.random() * 6 ) + '.jpg';
        $('#logo').attr({'src': logosrc});
        // for File API
        jQuery.event.props.push('dataTransfer');

        windowResize();

        $(document).bind('touchmove', function(e){
            e.preventDefault();
        });
        
        var socket = SocketCtrl();
        var dropbox = Dropbox(socket);
        $(window).resize(function(e){
            console.log('resize');
            windowResize(e);
        });
        var fileElem = $('#fileElem');
        $('#fileElem').on('change', function(e){
            e.preventDefault;
            socket.upload(e.target.files[0]);
            socket.assetsRqst();
        });
        $('.front').find('canvas').bind('click', function(e){
            fileElem.click();
            e.preventDefault;
        });
        setInterval(function(){
            bgCtrl.next();
        }, 100);
    });
})();