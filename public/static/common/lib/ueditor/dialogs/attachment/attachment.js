/**
 * User: Jinqn
 * Date: 14-04-08
 * Time: 下午16:34
 * 上传图片对话框逻辑代码,包括tab: 远程图片/上传图片/在线图片/搜索图片
 */

(function () {

    var uploadFile,
        onlineFile;

    // 顶部附件分类改变监听事件 - 重新初始化上传组件
    var selectElement = document.querySelector('#choice-category-container select');
    selectElement.addEventListener('change', function(event) {
        var id = '';
        var tabs = $G('tabhead').children;
        for (var i = 0; i < tabs.length; i++) {
            if (domUtils.hasClass(tabs[i], 'focus')) {
                id = tabs[i].getAttribute('data-content-id');
                break;
            }
        }
        switch(id) {
            case 'scan' :
                scanQrcodeInit();
                break;

            case 'upload' :
                uploadFile = new UploadFile('queueList');
                break;
        }
    });

    // 搜索关键字回车事件
    document.addEventListener('DOMContentLoaded', function() {
        var input = document.getElementById('search-input');
        input.addEventListener('keydown', function(event) {
            if(event.key === 'Enter') {
                // 模拟点击搜索按钮
                var element = document.getElementById('search-submit');
                if(element) {
                    element.click();
                }
            }
        });
    });
    // 搜索关键字placeholder设置
    document.getElementById('search-input').setAttribute('placeholder', lang.searchPlaceholder);

    // 左侧分类菜单事件初始化
    function leftCategoryEventInit() {
        document.querySelectorAll('#leftCategory li').forEach(function(element) {
            element.addEventListener('click', function(event) {
                if(!domUtils.hasClass(this, 'disabled')) {
                    // 取消同级所有li并选中当前li
                    document.querySelectorAll('#leftCategory li').forEach(function(li) {
                        domUtils.removeClasses(li, 'active');
                    });
                    domUtils.addClass(this, 'active');

                    // 模拟点击搜索按钮
                    var element = document.getElementById('search-submit');
                    if(element) {
                        element.click();
                    }
                }
            });
        });
    };
    // 分类事件
    leftCategoryEventInit();

    // 分类搜索-按钮确认
    $(document).on('click', '#leftCategory .category-search-submit', function() {
        var $parent = $(this).parent();
        var keywords = $parent.find('.category-search-input').val();
        if(keywords == '') {
            $parent.find('ul li').removeClass('none');
        } else {
            $parent.find('ul li').each(function() {
                if($(this).text().indexOf(keywords) == -1) {
                    $(this).addClass('none');
                } else {
                    $(this).removeClass('none');
                }
            });
        }
    });
    // 分类搜索-输入框回车
    $(document).on('keydown', '#leftCategory .category-search-input', function (event) {
        if(event.keyCode == 13) {
            $(this).parent().find('.category-search-submit').trigger('click');
            return false;
        }
    });
    // 搜索关键字placeholder设置
    document.querySelector('#leftCategory .category-search-input').setAttribute('placeholder', lang.CategoryInputPlaceholder);

    // 扫码初始化
    var scan_key = parseInt(Math.random() * 10000000001);
    var scan_timer = null;
    function scanQrcodeInit() {
        // 上传二维码和链接
        var select = editor.getChoiceCategoryPathTypeValue(document.querySelector('#choice-category-container select'));
        var location = window.location;
        var url = location.protocol+'//'+location.host+'?s=ueditor/scanupload/key/'+scan_key+'/cid/'+select.category_id+'/type/uploadfile';
        $('#scan .qrcode-content').empty().qrcode({
            text: url,
            width: ($(window).width() <= 641) ? 100 : 150,
            height: ($(window).width() <= 641) ? 100 : 150
        });
        $('#scan .qrcode-url .url-vlaue').text(url);
        $('#scan .qrcode-url .text-copy-submit').attr('data-value', url);

        // 定时请求数据
        if(scan_timer === null) {
            scan_timer = setInterval(function() {
                var url = editor.getOpt("serverUrl");
                var join = (url.indexOf('?') == -1) ? '?' : '&';
                var $list = $('#scan .qrcode-images-list table tbody');
                var $no_data = $('#scan .qrcode-images-list .no-data');
                $.post(url + join+"action=scandata", { key: scan_key }, function(response) {
                    if(response.code == 0 && (response.data || null) != null && response.data.length > 0)
                    {
                        response.data.forEach(function(item) {
                            if($list.find('tr.item-'+item.id).length == 0) {
                                var $tr = $(`<tr class="item-`+item.id+`">
                                    <td>
                                        <span>`+item.original+`</span>
                                    </td>
                                    <td>`+editor.AnnexSizeToUnit(item.size)+`</td>
                                    <td>
                                        <span class="delete" data-value="`+item.id+`">`+lang.uploadDelete+`</span>
                                    </td>
                                </tr>`);
                                $tr.on('click', '.delete', function() {
                                    if(!confirm(lang.deleteConfirmTips)) return;
                                    var $this = $(this);
                                    var id = $this.data('value');
                                    $.post(url + join+"action=deletefile", { id: $(this).data('value'), key: scan_key, upload_source: 'scanupload' }, function(response) {
                                        if (response.code == 0)
                                        {
                                            $this.parents('tr').remove();
                                            if($list.find('tr').length == 0) {
                                                $no_data.removeClass('none');
                                            }
                                        } else {
                                            alert(response.msg);
                                        }
                                    });
                                });
                                $list.append($tr);
                            }
                        });
                    }
                    if($list.find('tr').length > 0) {
                        $no_data.addClass('none');
                    } else {
                        $no_data.removeClass('none');
                    }
                });
            }, 3000);
        }
    }

    // 扫码上传链接复制
    if ($('.text-copy-submit').length > 0) {
        var text_copy_clipboard = new ClipboardJS('.text-copy-submit',
            {
                text: function (e) {
                    return $(e).attr('data-value') || $(e).text().trim();
                }
            });
        text_copy_clipboard.on('success', function (e) {
            alert(lang.copySuccessText, 'success');
        });
        text_copy_clipboard.on('error', function (e) {
            alert(lang.copyFailText);
        });
    }


    // 初始化
    window.onload = function () {
        initTabs();
        initAlign();
        initButtons();
    };

    /* 初始化tab标签 */
    function initTabs() {
        var tabs = $G('tabhead').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var target = e.target || e.srcElement;
                setTabFocus(target.getAttribute('data-content-id'));
            });
        }
        setTabFocus('upload');

        // 获取附件分类
        editor.getCategoryDataInit(document.querySelector('#choice-category-container select'), document.querySelector('#leftCategory ul'), function() {
            // 左侧分类事件绑定
            leftCategoryEventInit();

            // 重新初始化上传组件
            uploadFile = new UploadFile('queueList');

            // 扫码初始化
            scanQrcodeInit();
        });
    }

    /* 初始化tabbody */
    function setTabFocus(id) {
        if(!id) return;
        var i, bodyId, tabs = $G('tabhead').children;
        for (i = 0; i < tabs.length; i++) {
            bodyId = tabs[i].getAttribute('data-content-id')
            if (bodyId == id) {
                domUtils.addClass(tabs[i], 'focus');
                domUtils.addClass($G(bodyId), 'focus');
            } else {
                domUtils.removeClasses(tabs[i], 'focus');
                domUtils.removeClasses($G(bodyId), 'focus');
            }
        }

        document.getElementById('choice-category-container').setAttribute('class', 'none');
        document.getElementById('search-container').setAttribute('class', 'none');
        switch (id) {
            case 'scan':
                var $qrcode_url = $('#scan .qrcode-url .text-copy-submit');
                var url = $qrcode_url.attr('data-value') || null;
                if(url == null) {
                    $qrcode_url.hide();
                } else {
                    $qrcode_url.show();
                }
                document.getElementById('choice-category-container').setAttribute('class', '');
                break;
            case 'upload':
                document.getElementById('choice-category-container').setAttribute('class', '');
                uploadFile = uploadFile || new UploadFile('queueList');
                break;
            case 'online':
                document.getElementById('search-container').setAttribute('class', '');
                onlineFile = new OnlineFile('fileList');
                break;
        }
    }

    /* 初始化搜索点击事件 */
    function initAlign(){
        domUtils.on($G("search-submit"), 'click', function(e){
            onlineFile = new OnlineFile('fileList');
        });
    }

    /* 初始化onok事件 */
    function initButtons() {

        dialog.onok = function () {
            var list = [], id, tabs = $G('tabhead').children;
            for (var i = 0; i < tabs.length; i++) {
                if (domUtils.hasClass(tabs[i], 'focus')) {
                    id = tabs[i].getAttribute('data-content-id');
                    break;
                }
            }

            switch (id) {
                case 'upload':
                    list = uploadFile.getInsertList();
                    var count = uploadFile.getQueueCount();
                    if (count) {
                        $('.info', '#queueList').html('<span style="color:red;">' + '还有2个未上传文件'.replace(/[\d]/, count) + '</span>');
                        return false;
                    }
                    break;
                case 'online':
                    list = onlineFile.getInsertList();
                    break;
            }

            editor.execCommand('insertfile', list);
        };
    }


    /* 上传附件 */
    function UploadFile(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }
    UploadFile.prototype = {
        init: function () {
            this.fileList = [];
            this.initContainer();
            this.initUploader();
        },
        initContainer: function () {
            this.$queue = this.$wrap.find('.filelist');
        },
        /* 初始化容器 */
        initUploader: function () {
            var _this = this,
                $ = jQuery,    // just in case. Make sure it's not an other libaray.
                $wrap = _this.$wrap,
            // 图片容器
                $queue = $wrap.find('.filelist'),
            // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),
            // 文件总体选择信息。
                $info = $statusBar.find('.info'),
            // 上传按钮
                $upload = $wrap.find('.uploadBtn'),
            // 上传按钮
                $filePickerBtn = $wrap.find('.filePickerBtn'),
            // 上传按钮
                $filePickerBlock = $wrap.find('.filePickerBlock'),
            // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),
            // 总体进度条
                $progress = $statusBar.find('.progress').hide(),
            // 添加的文件数量
                fileCount = 0,
            // 添加的文件总大小
                fileSize = 0,
            // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,
            // 缩略图大小
                thumbnailWidth = 113 * ratio,
                thumbnailHeight = 113 * ratio,
            // 可能有pedding, ready, uploading, confirm, done.
                state = '',
            // 所有文件的进度信息，key为file id
                percentages = {},
                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                            'WebkitTransition' in s ||
                            'MozTransition' in s ||
                            'msTransition' in s ||
                            'OTransition' in s;
                    s = null;
                    return r;
                })(),
            // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('fileActionName')),
                fileMaxSize = editor.getOpt('fileMaxSize'),
                acceptExtensions = (editor.getOpt('fileAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, '');;

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            } else if (!editor.getOpt('fileActionName')) {
                $('#filePickerReady').after($('<div>').html(lang.errorLoadConfig)).hide();
                return;
            }

            // 当前选中的分类
            var select = editor.getChoiceCategoryPathTypeValue(document.querySelector('#choice-category-container select'));
            if((select.path_type || null) != null) {
                actionUrl = editor.actionUrlPathTypeReplace(actionUrl, select.path_type);
            }

            uploader = _this.uploader = WebUploader.create({
                pick: {
                    id: '#filePickerReady',
                    label: lang.uploadSelectFile
                },
                swf: '../../third-party/webuploader/Uploader.swf',
                server: actionUrl,
                formData: {ajax: 'ajax', category_id: select.category_id},
                // 粘贴事件
                paste: '#queueList',
                // 开启拖入
                dnd: '#queueList',
                // 屏蔽拖拽区域外的响应
                disableGlobalDnd:true,
                fileVal: editor.getOpt('fileFieldName'),
                duplicate: true,
                fileSingleSizeLimit: fileMaxSize,
                compress: false,
                threads: 1
            });
            uploader.addButton({
                id: '#filePickerBlock'
            });
            uploader.addButton({
                id: '#filePickerBtn',
                label: lang.uploadAddFile
            });

            setState('pedding');

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                        '<p class="title">' + file.name + '</p>' +
                        '<p class="imgWrap"></p>' +
                        '<p class="progress"><span></span></p>' +
                        '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">' + lang.uploadDelete + '</span>' +
                        '<span class="rotateRight">' + lang.uploadTurnRight + '</span>' +
                        '<span class="rotateLeft">' + lang.uploadTurnLeft + '</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>').hide().appendTo($li),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = lang.errorExceedSize;
                                break;
                            case 'interrupt':
                                text = lang.errorInterrupt;
                                break;
                            case 'http':
                                text = lang.errorHttp;
                                break;
                            case 'not_allow_type':
                                text = lang.errorFileType;
                                break;
                            default:
                                text = lang.errorUploadRetry;
                                break;
                        }
                        $info.text(text).show();
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    $wrap.text(lang.uploadPreview);
                    if ('|png|jpg|jpeg|bmp|gif|'.indexOf('|'+file.ext.toLowerCase()+'|') == -1) {
                        $wrap.empty().addClass('notimage').append('<i class="file-preview file-type-' + file.ext.toLowerCase() + '"></i>' +
                        '<span class="file-title" title="' + file.name + '">' + file.name + '</span>');
                    } else {
                        if (browser.ie && browser.version <= 7) {
                            $wrap.text(lang.uploadNoPreview);
                        } else {
                            uploader.makeThumb(file, function (error, src) {
                                if (error || !src) {
                                    $wrap.text(lang.uploadNoPreview);
                                } else {
                                    var $img = $('<img src="' + src + '">');
                                    $wrap.empty().append($img);
                                    $img.on('error', function () {
                                        $wrap.text(lang.uploadNoPreview);
                                    });
                                }
                            }, thumbnailWidth, thumbnailHeight);
                        }
                    }
                    percentages[ file.id ] = [ file.size, 0 ];
                    file.rotation = 0;

                    /* 检查文件格式 */
                    if (!file.ext || acceptExtensions.indexOf(file.ext.toLowerCase()) == -1) {
                        showError('not_allow_type');
                        uploader.removeFile(file);
                    }
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }
                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[ file.id ][ 1 ] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[ file.id ][ 1 ] = 0;
                    } else if (cur === 'progress') {
                        $info.hide();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({height: 30});
                });
                $li.on('mouseleave', function () {
                    $btns.stop().animate({height: 0});
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;
                        case 1:
                            file.rotation += 90;
                            break;
                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                    }

                });

                $li.insertBefore($filePickerBlock);
            }

            // 负责view的销毁
            function removeFile(file) {
                var $li = $('#' + file.id);
                delete percentages[ file.id ];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[ 0 ];
                    loaded += v[ 0 ] * v[ 1 ];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function setState(val, files) {

                if (val != state) {

                    var stats = uploader.getStats();

                    $upload.removeClass('state-' + state);
                    $upload.addClass('state-' + val);

                    switch (val) {

                        /* 未选择文件 */
                        case 'pedding':
                            $queue.addClass('element-invisible');
                            $statusBar.addClass('element-invisible');
                            $placeHolder.removeClass('element-invisible');
                            $progress.hide(); $info.hide();
                            uploader.refresh();
                            break;

                        /* 可以开始上传 */
                        case 'ready':
                            $placeHolder.addClass('element-invisible');
                            $queue.removeClass('element-invisible');
                            $statusBar.removeClass('element-invisible');
                            $progress.hide(); $info.show();
                            $upload.text(lang.uploadStart);
                            uploader.refresh();
                            break;

                        /* 上传中 */
                        case 'uploading':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadPause);
                            break;

                        /* 暂停上传 */
                        case 'paused':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadContinue);
                            break;

                        case 'confirm':
                            $progress.show(); $info.hide();
                            $upload.text(lang.uploadStart);

                            stats = uploader.getStats();
                            if (stats.successNum && !stats.uploadFailNum) {
                                setState('finish');
                                return;
                            }
                            break;

                        case 'finish':
                            $progress.hide(); $info.show();
                            if (stats.uploadFailNum) {
                                $upload.text(lang.uploadRetry);
                            } else {
                                $upload.text(lang.uploadStart);
                            }
                            break;
                    }

                    state = val;
                    updateStatus();

                }

                if (!_this.getQueueCount()) {
                    $upload.addClass('disabled')
                } else {
                    $upload.removeClass('disabled')
                }

            }

            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = lang.updateStatusReady.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize));
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = lang.updateStatusConfirm.replace('_', stats.successNum).replace('_', stats.successNum);
                    }
                } else {
                    stats = uploader.getStats();
                    text = lang.updateStatusFinish.replace('_', fileCount).
                        replace('_KB', WebUploader.formatSize(fileSize)).
                        replace('_', stats.successNum);

                    if (stats.uploadFailNum) {
                        text += lang.updateStatusError.replace('_', stats.uploadFailNum);
                    }
                }

                $info.html(text);
            }

            uploader.on('fileQueued', function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
            });

            uploader.on('fileDequeued', function (file) {
                fileCount--;
                fileSize -= file.size;

                removeFile(file);
                updateTotalProgress();
            });

            uploader.on('filesQueued', function (file) {
                if (!uploader.isInProgress() && (state == 'pedding' || state == 'finish' || state == 'confirm' || state == 'ready')) {
                    setState('ready');
                }
                updateTotalProgress();
            });

            uploader.on('all', function (type, files) {
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm', files);
                        break;
                    case 'startUpload':
                        /* 添加额外的GET参数 */
                        var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                            url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?':'&') + 'encode=utf-8&' + params);
                        uploader.option('server', url);
                        setState('uploading', files);
                        break;
                    case 'stopUpload':
                        setState('paused', files);
                        break;
                }
            });

            uploader.on('uploadBeforeSend', function (file, data, header) {
                //这里可以通过data对象添加POST参数
                header['X_Requested_With'] = 'XMLHttpRequest';
            });

            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[ file.id ][ 1 ] = percentage;
                updateTotalProgress();
            });

            uploader.on('uploadSuccess', function (file, ret) {
                var $file = $('#' + file.id);
                try {
                    var responseText = (ret._raw || ret),
                        json = utils.str2json(responseText);
                    if (json.code == 0) {
                        //_this.fileList.push(json.data);
                        _this.fileList[$file.index()] = json.data;
                        $file.append('<span class="success"></span>');
                    } else {
                        $file.find('.error').text(json.msg).show();
                    }
                } catch (e) {
                    $file.find('.error').text(lang.errorServerUpload).show();
                }
            });

            uploader.on('uploadError', function (file, code) {
            });
            uploader.on('error', function (code, file) {
                if (code == 'Q_TYPE_DENIED' || code == 'F_EXCEED_SIZE') {
                    addFile(file);
                }
            });
            uploader.on('uploadComplete', function (file, ret) {
            });

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        },
        getQueueCount: function () {
            var file, i, status, readyFile = 0, files = this.uploader.getFiles();
            for (i = 0; file = files[i++]; ) {
                status = file.getStatus();
                if (status == 'queued' || status == 'uploading' || status == 'progress') readyFile++;
            }
            return readyFile;
        },
        getInsertList: function () {
            var i, link, data, list = [],
                prefix = editor.getOpt('fileUrlPrefix');
            for (i = 0; i < this.fileList.length; i++) {
                data = this.fileList[i] || null;
                if(data != null && (data.url || null) != null)
                {
                    link = data.url;
                    list.push({
                        title: data.original || link.substr(link.lastIndexOf('/') + 1),
                        url: prefix + link
                    });
                }
            }
            return list;
        }
    };


    /* 在线附件 */
    function OnlineFile(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.init();
    }
    OnlineFile.prototype = {
        init: function () {
            this.initContainer();
            this.initEvents();
            this.initData();
        },
        /* 初始化容器 */
        initContainer: function () {
            this.container.innerHTML = '';
            this.list = document.createElement('ul');
            this.clearFloat = document.createElement('li');

            domUtils.addClass(this.list, 'list');
            domUtils.addClass(this.clearFloat, 'clearFloat');

            this.list.appendChild(this.clearFloat);
            this.container.appendChild(this.list);
        },
        /* 初始化滚动事件,滚动到地步自动拉取数据 */
        initEvents: function () {
            var _this = this;

            /* 滚动拉取图片 */
            domUtils.on($G('fileList'), 'scroll', function(e){
                var panel = this;
                if (panel.scrollHeight - (panel.offsetHeight + panel.scrollTop) < 10) {
                    _this.getFileData();
                }
            });
            /* 选中图片 */
            domUtils.on(this.list, 'click', function (e) {
                var target = e.target || e.srcElement,
                    li = target.parentNode;

                if (li.tagName.toLowerCase() == 'li') {
                    // 选择顺序 start
                    var $select_count_container = $(li).find('.select-count');
                    // 选择顺序 end

                    if (domUtils.hasClass(li, 'selected')) {
                        domUtils.removeClasses(li, 'selected');

                        // 选择顺序 start
                        $select_count_container.css('display', 'none');
                        $select_count_container.text('');
                        // 选择顺序 end
                    } else {
                        domUtils.addClass(li, 'selected');

                        // 选择顺序 start
                        var count = 0;
                        $($G('fileList')).find('li.selected').each(function(k, v)
                        {
                            var temp = parseInt($(this).find('.select-count').text());
                            if(temp > count)
                            {
                                count = temp;
                            }
                        });
                        $select_count_container.css('display', 'block');
                        $select_count_container.text(count+1);
                        // 选择顺序 end
                    }

                    // 选择顺序 start
                    _this.selectSortHandle();
                    // 选择顺序 end
                }
            });
        },
        /* 选择顺序处理 */
        selectSortHandle: function()
        {
            var arr = [];
            $($G('fileList')).find('li.selected').each(function(k, v)
            {
                var count = parseInt($(this).find('.select-count').text())-1;
                arr[count] = {
                    "count": count,
                    "e": $(this)
                };
            });
            if(arr.length > 0)
            {
                arr = arr.sort().filter(a=>a);
                for(var i in arr)
                {
                    $(arr[i]['e']).find('.select-count').text(parseInt(i)+1);
                }
            }
        },
        /* 初始化第一次的数据 */
        initData: function () {

            /* 拉取数据需要使用的值 */
            this.state = 0;
            this.listSize = editor.getOpt('fileManagerListSize');
            this.listIndex = 0;
            this.listEnd = false;

            /* 第一次拉取数据 */
            this.getFileData();
        },
        /* 向后台拉取图片列表数据 */
        getFileData: function () {
            var _this = this;

            if(!_this.listEnd && !this.isLoadingData) {
                this.isLoadingData = true;
                var url = editor.getActionUrl(editor.getOpt('fileManagerActionName'));
                // 分类选中数据
                var active = editor.getLeftCategoryChoiceData(document.querySelector('#leftCategory li.active'));
                // 当前选中的分类标识
                if((active.path_type || null) != null) {
                    url = editor.actionUrlPathTypeReplace(url, active.path_type);
                }
                // 加载提示
                var loading = document.getElementById('loading');
                if(_this.listIndex == 0) {
                    loading.innerHTML = lang.loadingMsg;
                    domUtils.removeClasses(loading, 'none');
                }
                ajax.request(url, {
                    timeout: 100000,
                    data: utils.extend({
                            start: _this.listIndex,
                            size: _this.listSize,
                            keywords: document.getElementById('search-input').value,
                            category_id: active.category_id
                        }, editor.queryCommandValue('serverparam')),
                    method: 'get',
                    onsuccess: function (r) {
                        try {
                            var json = eval('(' + r.responseText + ')');
                            if (json.code == 0) {
                                _this.pushData(json.data.list);
                                _this.listIndex = parseInt(json.data.start) + parseInt(json.data.list.length);
                                if(_this.listIndex >= json.data.total) {
                                    _this.listEnd = true;
                                }
                                loading.innerHTML = '';
                                domUtils.addClass(loading, 'none');
                            } else {
                                if(_this.listIndex == 0) {
                                    loading.innerHTML = json.msg;
                                    domUtils.removeClasses(loading, 'none');
                                }
                            }
                            _this.isLoadingData = false;

                            // 分页数据
                            document.querySelector('#pagination .page').innerHTML = json.data.page;
                            document.querySelector('#pagination .size').innerHTML = json.data.size;
                            document.querySelector('#pagination .page-total').innerHTML = json.data.page_total;
                            document.querySelector('#pagination .total').innerHTML = json.data.total;
                        } catch (e) {
                            if(r.responseText.indexOf('ue_separate_ue') != -1) {
                                var list = r.responseText.split(r.responseText);
                                _this.pushData(list);
                                _this.listIndex = parseInt(list.length);
                                _this.listEnd = true;
                            }
                            _this.isLoadingData = false;
                        }
                    },
                    onerror: function () {
                        _this.isLoadingData = false;
                        if(_this.listIndex == 0) {
                            loading.innerHTML = lang.errorServerUpload;
                            domUtils.removeClasses(loading, 'none');
                        }
                    }
                });
            }
        },
        /* 添加图片到列表界面上 */
        pushData: function (list) {
            var i, item, img, filetype, preview, icon, _this = this,
                urlPrefix = editor.getOpt('fileManagerUrlPrefix');
            for (i = 0; i < list.length; i++) {
                if(list[i] && list[i].url) {
                    item = document.createElement('li');
                    icon = document.createElement('span');
                    filetype = list[i].url.substr(list[i].url.lastIndexOf('.') + 1);

                    if ( "png|jpg|jpeg|gif|bmp".indexOf(filetype) != -1 ) {
                        preview = document.createElement('img');
                        domUtils.on(preview, 'load', (function(image){
                            return function(){
                                _this.scale(image, image.parentNode.offsetWidth, image.parentNode.offsetHeight);
                            };
                        })(preview));
                        preview.width = 113;
                        preview.setAttribute('src', urlPrefix + list[i].url + (list[i].url.indexOf('?') == -1 ? '?noCache=':'&noCache=') + (+new Date()).toString(36) );
                    } else {
                        var ic = document.createElement('i'),
                            textSpan = document.createElement('span');
                        preview = document.createElement('div');
                        preview.appendChild(ic);
                        preview.appendChild(textSpan);
                        domUtils.addClass(preview, 'file-wrapper');
                        domUtils.addClass(ic, 'file-type-' + filetype);
                        domUtils.addClass(ic, 'file-preview');
                    }
                    domUtils.addClass(icon, 'icon');
                    item.setAttribute('data-url', urlPrefix + list[i].url);
                    if (list[i].original) {
                        item.setAttribute('data-title', list[i].original);
                    }

                    item.appendChild(preview);
                    item.appendChild(icon);

                    // 原名功能 start
                    var original = document.createElement('p');
                    original.setAttribute('class', 'attachment-title');
                    original.innerHTML = list[i].original;
                    item.appendChild(original);
                    // 原名功能 end
                    
                    // 选择计数 start
                    var select_count = document.createElement('span');
                    select_count.setAttribute('class', 'select-count');
                    select_count.style.display = 'none';
                    select_count.innerHTML = '';
                    item.appendChild(select_count);
                    // 选择计数 end

                    // 文件添加删除功能 start
                    item.appendChild($("<span class='delbtn' data-id='" + list[i].id + "'>✕</span>").click(function() {
                        var del = $(this);
                        try{
                            window.event.cancelBubble = true; //停止冒泡
                            window.event.returnValue = false; //阻止事件的默认行为
                            window.event.preventDefault();    //取消事件的默认行为  
                            window.event.stopPropagation();   //阻止事件的传播
                        } finally {
                            if(!confirm(lang.deleteConfirmTips)) return;
                            var url = editor.getOpt("serverUrl");
                            var join = (url.indexOf('?') == -1) ? '?' : '&';
                            $.post(url + join+"action=deletefile", { "id": del.attr("data-id") }, function(response) {
                                if (response.code == 0)
                                {
                                    del.parent().remove();

                                    // 选择顺序 start
                                    _this.selectSortHandle();
                                    // 选择顺序 end
                                } else {
                                    alert(response.msg);
                                }
                            });
                        }
                    })[0]);
                    // 文件添加删除功能 end
                    // 
                    this.list.insertBefore(item, this.clearFloat);
                }
            }
        },
        /* 改变图片大小 */
        scale: function (img, w, h, type) {
            var ow = img.width,
                oh = img.height;

            if (type == 'justify') {
                if (ow >= oh) {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            } else {
                if (ow >= oh) {
                    img.width = w * ow / oh;
                    img.height = h;
                    img.style.marginLeft = '-' + parseInt((img.width - w) / 2) + 'px';
                } else {
                    img.width = w;
                    img.height = h * oh / ow;
                    img.style.marginTop = '-' + parseInt((img.height - h) / 2) + 'px';
                }
            }
        },
        getInsertList: function () {
            var i, lis = this.list.children, list = [];
            for (i = 0; i < lis.length; i++) {
                if (domUtils.hasClass(lis[i], 'selected')) {
                    var url = lis[i].getAttribute('data-url');
                    var title = lis[i].getAttribute('data-title') || url.substr(url.lastIndexOf('/') + 1);
                    if((lis[i] || null) != null)
                    {
                        var index = parseInt($(lis[i]).find('.select-count').text())-1;
                        list[index] = {
                            title: title,
                            url: url
                        }
                    }
                }
            }
            return list.length ? list.sort().filter(a=>a) : list;
        }
    };


})();