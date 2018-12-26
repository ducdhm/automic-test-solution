(function ($) {
    var Msg = {
        init: function () {
            var self = this;
            var $notice = self.$notice = $('#notice');
            var $btnClose = $notice.find('a.close');
            
            $btnClose.on('click', function (e) {
                e.preventDefault();
                
                self.hide();
            });
        },
        
        show: function (msg) {
            this.$notice.removeClass('hide').find('span').html(msg);
        },
        
        hide: function () {
            this.$notice.addClass('hide');
        }
    };
    
    Modal = {
        init: function () {
            var self = this,
                $modal = self.$modal = $('#modal-addnew'),
                $btnCloses = $modal.find('.close, .btn-close'),
                $btnAddNew = $modal.find('.btn-addnew'),
                $txtName = $modal.find('#txt-name'),
                $txtWrapper = self.$txtWrapper = $txtName.parent().parent(),
                $msg = self.$msg = $modal.find('p.alert'),
                $btnCloseMsg = $msg.find('.close');
            
            $modal.modal({
                keyboard: false,
                show: false,
                backdrop: 'static'
            });
            
            $btnCloses.each(function () {
                var $btnClose = $(this);
                
                $btnClose.on('click', function (e) {
                    e.preventDefault();
                    
                    if (!$btnClose.hasClass('disabled')) {
                        self.hide();
                    }
                });
            });
            
            $btnAddNew.on('click', function (e) {
                e.preventDefault();
                
                if (!$btnAddNew.hasClass('disabled')) {
                    var name = $txtName.val().trim();
                    
                    if (name) {
                        self.hideMsg();
                        $txtWrapper.removeClass('error');
                        $txtWrapper.addClass('success');
                        
                        $btnAddNew.addClass('disabled');
                        $txtName.attr('disabled', true);
                        $btnCloses.addClass('disabled');
                        
                        $.ajax({
                            url: './stubs/add.html',
                            type: 'post',
                            data: {
                                name: name
                            },
                            success: function (response) {
                                self.hide();
                                DucDhmTemplate.$listTemplate.find('li.active').removeClass('active');
                                DucDhmTemplate.$listTemplate.append(
                                    '<li class="active">' +
                                    '<a tabindex="-1" data-id="' + response + '" href="#">' + name + '</a>' +
                                    '</li>'
                                );
                                DucDhmTemplate.editor.setData('<p></p>');
                                DucDhmTemplate.editor.setReadOnly(false);
                                DucDhmTemplate.current_data = '';
                                DucDhmTemplate.$listTemplate.find('li').addClass('disabled');
                                DucDhmTemplate.$btnCancel.add(DucDhmTemplate.$btnSave).removeClass('disabled');
                                Msg.show('New template name <strong>' + name + '</strong> was added!');
                                
                                $btnAddNew.add($btnCloses).removeClass('disabled');
                                $txtName.attr('disabled', false);
                            }
                        });
                    } else {
                        self.showMsg('Please enter name of template!');
                        $txtWrapper.removeClass('success');
                        $txtWrapper.addClass('error');
                    }
                }
            });
            
            $btnCloseMsg.on('click', function (e) {
                e.preventDefault();
                
                self.hideMsg();
            });
        },
        
        show: function () {
            this.$modal.modal('show');
        },
        
        hide: function () {
            this.$modal.modal('hide');
            this.hideMsg();
            this.$txtWrapper.removeClass('error success');
        },
        
        showMsg: function (msg) {
            this.$msg.removeClass('hide').find('span').html(msg);
        },
        
        hideMsg: function () {
            this.$msg.addClass('hide');
        }
    };
    
    var DucDhmTemplate = {
        init: function () {
            var self = this;
            self.$listTemplate = $('#list-template');
            self.$loading = $('#loading');
            self.$btnAdd = $('.btn-add');
            self.$btnEdit = $('.btn-edit');
            self.$btnDelete = $('.btn-delete');
            self.$btnSave = $('.btn-save');
            self.$btnCancel = $('.btn-cancel');
            
            self.template_autocomplete = new EJS({
                url: './template/autocomplete.ejs'
            });
            
            self.initEditor();
            self.loadList();
            self.bindEventForList();
            self.bindEventForControllers();
        },
        
        keymap: {
            BACKSPACE: 8,
            SPACE: 32,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            ENTER: 13,
            ESC: 27,
            END: 35,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            CHAR_AT: 50,
            HOME: 36
        },
        
        initEditor: function () {
            var self = this;
            
            // Init editor
            $('#editor').ckeditor({
                height: '275px',
                readOnly: true,
                resize_enabled: false,
                autoParagraph: false,
                keystrokes: [
                    [self.keymap.ENTER, 'alternateEnter']
                ],
                extraPlugins: 'alternateEnter'
            });
            
            var editor = self.editor = CKEDITOR.instances.editor;
            
            CKEDITOR.on('instanceReady', function () {
                self.$autocomplete = $('#ducdhm-autocomplete');
                self.autocomplete = self.$autocomplete.get(0);
                
                var $content = $('#cke_1_contents');
                
                self.contentPosition = $content.position();
                
                // Check for scroll event of CKEditor content
                $content.find('iframe').contents().on('scroll', function () {
                
                });
                
                editor.on('contentDom', function () {
                    editor.document.on('keydown', function (e) {
                        if (!editor.readOnly) {
                            self.keyDownHandler(e);
                        }
                    });
                });
            });
        },
        
        getActiveAc: function () {
            var self = this;
            var $autocomplete = self.$autocomplete;
            var $actived = $autocomplete.find('li.active');
            
            return [$actived, $actived.index()];
        },
        
        setActiveAc: function (index) {
            var self = this;
            var $autocomplete = self.$autocomplete;
            var $lis = $autocomplete.find('li');
            
            $lis.filter('.active').removeClass('active');
            $lis.eq(index).addClass('active');
            $autocomplete.scrollTop(index * 26);
        },
        
        insertNewLine: function (editor) {
            editor.insertHtml('<p></p>');
            editor.getSelection().getStartElement().getElementsByTag('br').$[0].remove();
        },
        
        eventHandlerForAc: function (key_code) {
            var self = this;
            var editor = self.editor;
            var keymap = self.keymap;
            var $autocomplete = self.$autocomplete;
            var autocomplete = self.autocomplete;
            var lis_length = $autocomplete.find('li').length;
            var active = self.getActiveAc();
            var $active = active[0];
            var actived_index = active[1];
            
            switch (key_code) {
                case keymap.ENTER:
    
                    console.log('=========', actived_index)
                    if (actived_index !== -1) {
                        var type = $active.data('type');
                        var text = $active.data('text');
                        var element = editor.getSelection().getStartElement().$;
                        
                        element.remove();
                        
                        if (type === 'text') {
                            editor.insertText(text);
                        } else {
                            editor.insertHtml(
                                '<a href="#" class="ducdhm-' + type + '">' + (type === 'contact' ? '' : '@') + text + '</a>'
                            );
                        }
                    } else {
                        self.insertNewLine(editor);
                    }
                    
                    autocomplete.style.display = 'none';
                    break;
                
                case keymap.UP:
                    if (actived_index === 0 || actived_index === -1) {
                        self.setActiveAc(lis_length - 1);
                    } else {
                        self.setActiveAc(actived_index - 1);
                    }
                    break;
                
                case keymap.DOWN:
                    if (actived_index === lis_length - 1 || actived_index === -1) {
                        self.setActiveAc(0);
                    } else {
                        self.setActiveAc(actived_index + 1);
                    }
                    break;
            }
        },
        
        keyDownHandler: function (e) {
            var self = this;
            var keymap = self.keymap;
            var editor = self.editor;
            var origin_event = e.data.$;
            var key_code = origin_event.keyCode;
            var autocomplete = self.autocomplete;
            
            if (key_code === keymap.CHAR_AT && origin_event.shiftKey) {
                origin_event.preventDefault();
                
                var element = editor.getSelection().getStartElement().$;
                if (element.className.indexOf('ducdhm') === -1) {
                    if (editor.mode == 'wysiwyg') {
                        editor.insertHtml('<a class="ducdhm" href="">@</a>');
                    }
                }
            } else {
                if (key_code === keymap.SPACE) {
                    var element = editor.getSelection().getStartElement().$;
                    
                    if (element.className.indexOf('ducdhm') === 0) {
                        if (element.innerHTML === "@") {
                            element.remove();
                            editor.insertText('@');
                        } else {
                            origin_event.preventDefault();
                            if (autocomplete.style.display === 'block') {
                                autocomplete.style.display = 'none';
                            }
                            editor.execCommand('unlink');
                            editor.insertHtml(' ');
                        }
                    }
                } else if (key_code !== keymap.SHIFT && key_code !== keymap.ALT && key_code !== keymap.CTRL && key_code !== keymap.LEFT && key_code !== keymap.RIGHT && key_code !== keymap.END && key_code !== keymap.HOME && key_code !== keymap.BACKSPACE) {
                    var element = editor.getSelection().getStartElement().$;
                    if (key_code === keymap.UP || key_code === keymap.DOWN) {
                        if (autocomplete.style.display === 'block') {
                            origin_event.preventDefault();
                            self.eventHandlerForAc(key_code);
                        }
                    } else if (key_code === keymap.ESC) {
                        if (autocomplete.style.display === 'block') {
                            autocomplete.style.display = 'none';
                        }
                    } else {
                        if (element.className.indexOf('ducdhm') === 0) {
                            setTimeout(function () {
                                self.doAutocomplete(element);
                            }, 0);
                        } else {
                            if (autocomplete.style.display === 'block') {
                                autocomplete.style.display = 'none';
                            }
                        }
                    }
                }
            }
        },
        
        doAutocomplete: function (element) {
            var self = this;
            var text = element.innerHTML.replace('@', '');
            
            $.ajax({
                url: './stubs/get_auto.json',
                data: {
                    text: text
                },
                dataType: 'json',
                type: 'get',
                success: function (response) {
                    self.showAutocomplete(element, response);
                }
            });
        },
        
        showAutocomplete: function (element, response) {
            var self = this;
            var position = self.getCursorPosition(element);
            var $autocomplete = self.$autocomplete;
            var autocomplete = self.autocomplete;
            var contentPosition = self.contentPosition;
            var scrollTop = self.editor.document.getDocumentElement().$.scrollTop;
            
            autocomplete.style.top = (position[1] + 16 + contentPosition.top - scrollTop) + 'px';
            autocomplete.style.left = (position[0] + contentPosition.left) + 'px';
            
            autocomplete.innerHTML = self.template_autocomplete.render({list: response});
            autocomplete.style.display = 'block';
            $autocomplete.scrollTop(0);
        },
        
        getCursorPosition: function (element) {
            var x = 0;
            var y = 0;
            
            while (element.offsetParent) {
                x += element.offsetLeft;
                y += element.offsetTop;
                element = element.offsetParent;
            }
            x += element.offsetLeft;
            y += element.offsetTop;
            
            return [x, y];
        },
        
        loadList: function () {
            var self = this,
                $listTemplate = self.$listTemplate,
                $btnAdd = self.$btnAdd;
            
            $.ajax({
                url: './stubs/load.json',
                type: 'get',
                dataType: 'json',
                success: function (response) {
                    $listTemplate.html(
                        new EJS({
                            url: './template/list.ejs'
                        }).render({
                            list: response
                        })
                    ).removeClass('loading');
                    $btnAdd.removeClass('disabled');
                }
            });
        },
        
        bindEventForList: function () {
            var self = this,
                $listTemplate = self.$listTemplate,
                $loading = self.$loading,
                $btnEdit = self.$btnEdit,
                $btnDelete = self.$btnDelete;
            
            $listTemplate.on('click', 'li', function (e) {
                e.preventDefault();
                
                var $this = $(this),
                    id = $this.find('a').data('id');
                
                if (!$this.hasClass('disabled')) {
                    if (!$this.hasClass('active')) {
                        $this.addClass('active').siblings('.active').removeClass('active');
                        $loading.removeClass('hide');
                        
                        $.ajax({
                            url: './stubs/get.html',
                            type: 'get',
                            data: {
                                id: id
                            },
                            success: function (response) {
                                if ($btnEdit.hasClass('disabled')) {
                                    $btnEdit.add($btnDelete).removeClass('disabled');
                                }
                                
                                self.current_data = response;
                                self.editor.setData(response);
                                $loading.addClass('hide');
                            }
                        });
                    }
                }
            });
        },
        
        bindEventForControllers: function () {
            var self = this,
                $btnAdd = self.$btnAdd,
                $btnEdit = self.$btnEdit,
                $btnDelete = self.$btnDelete,
                $btnSave = self.$btnSave,
                $btnCancel = self.$btnCancel,
                editor = self.editor,
                $listTemplate = self.$listTemplate;
            
            $btnAdd.on('click', function (e) {
                e.preventDefault();
                
                if (!$btnAdd.hasClass('disabled')) {
                    Modal.show();
                }
            });
            
            $btnEdit.on('click', function (e) {
                e.preventDefault();
                
                if (!$btnEdit.hasClass('disabled')) {
                    editor.setReadOnly(false);
                    
                    $listTemplate.find('li').addClass('disabled');
                    $btnCancel.add($btnSave).removeClass('disabled');
                    $btnAdd.add($btnEdit).add($btnDelete).addClass('disabled');
                }
            });
            
            $btnDelete.on('click', function (e) {
                e.preventDefault();
                
                if (!$btnDelete.hasClass('disabled')) {
                    $btnAdd.add($btnEdit).add($btnDelete).addClass('disabled');
                    
                    var $activedLi = $listTemplate.find('li.active');
                    var id = $activedLi.find('a').data('id');
                    var name = $activedLi.text().trim();
                    
                    $.ajax({
                        url: './stubs/delete.html',
                        type: 'post',
                        data: {
                            id: id
                        },
                        success: function (response) {
                            editor.setData('');
                            $activedLi.remove();
                            $btnAdd.add($btnEdit).add($btnDelete).removeClass('disabled');
                            Msg.show('<strong>' + name + '</strong> was deleted!');
                        }
                    });
                }
            });
            
            $btnSave.on('click', function (e) {
                e.preventDefault();
                
                if (!$btnSave.hasClass('disabled')) {
                    editor.setReadOnly(true);
                    $btnCancel.add($btnSave).addClass('disabled');
                    
                    var $activedLi = $listTemplate.find('li.active');
                    var id = $activedLi.find('a').data('id');
                    var name = $activedLi.text().trim();
                    var text = editor.getData();
                    
                    if (self.autocomplete.style.display === 'block') {
                        self.autocomplete.style.display = 'none';
                    }
                    
                    $.ajax({
                        url: './stubs/save.html',
                        type: 'post',
                        data: {
                            id: id,
                            text: encodeURIComponent(text)
                        },
                        success: function (response) {
                            $listTemplate.find('li').removeClass('disabled');
                            $btnAdd.add($btnEdit).add($btnDelete).removeClass('disabled');
                            Msg.show('<strong>' + name + '</strong> was saved!');
                        }
                    });
                }
            });
            
            $btnCancel.on('click', function (e) {
                e.preventDefault();
                
                if (!$btnCancel.hasClass('disabled')) {
                    editor.setData(self.current_data);
                    editor.setReadOnly(true);
                    $listTemplate.find('li').removeClass('disabled');
                    $btnCancel.add($btnSave).addClass('disabled');
                    $btnAdd.add($btnEdit).add($btnDelete).removeClass('disabled');
                    if (self.autocomplete.style.display === 'block') {
                        self.autocomplete.style.display = 'none';
                    }
                }
            });
        }
    };
    
    $(function () {
        Msg.init();
        Modal.init();
        DucDhmTemplate.init();
    });
    
    window.DucDhmTemplate = DucDhmTemplate;
    
}(jQuery));