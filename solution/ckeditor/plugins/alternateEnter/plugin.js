(function (win) {
	var DucDhmTemplate = win.DucDhmTemplate;

	var alternateEnterCmd = {
		exec: function (editor) {
			var element = editor.getSelection().getStartElement().$;
			var autocomplete = DucDhmTemplate.autocomplete;

			if (element.className.indexOf('ducdhm') === 0) {
				if (autocomplete.style.display === 'block') {
					DucDhmTemplate.eventHandlerForAc(13);
				} else {
					if (element.innerHTML === "@") {
						element.remove();
						editor.insertText('@');
					}
					editor.execCommand('unlink');
					DucDhmTemplate.insertNewLine(editor);
				}
			} else {
				DucDhmTemplate.insertNewLine(editor);
			}
			return;
		}
	};

	CKEDITOR.plugins.add('alternateEnter', {
		init: function (editor) {
			editor.addCommand('alternateEnter', alternateEnterCmd);
		}
	});
}(window));