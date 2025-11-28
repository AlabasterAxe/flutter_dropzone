if (typeof FlutterDropzone === 'undefined') {
class FlutterDropzone {
  constructor(container, onLoaded, onError, onHover, onDrop, onDropFile, onDropString, onDropInvalid, onDropMultiple, onDropFiles, onDropStrings, onLeave) {
    this.onError = onError;
    this.onHover = onHover;
    this.onDrop = onDrop;
    this.onDropFile = onDropFile;
    this.onDropString = onDropString;
    this.onDropInvalid = onDropInvalid;
    this.onDropMultiple = onDropMultiple;
    this.onDropFiles = onDropFiles;
    this.onDropStrings = onDropStrings;
    this.onLeave = onLeave;
    this.dropMIME = null;
    this.dropOperation = 'copy';

    container.addEventListener('dragover', this.dragover_handler.bind(this));
    container.addEventListener('dragleave', this.dragleave_handler.bind(this));
    container.addEventListener('drop', this.drop_handler.bind(this));

    if (onLoaded != null) onLoaded();
  }

  updateHandlers(onLoaded, onError, onHover, onDrop, onDropFile, onDropString, onDropInvalid, onDropMultiple, onDropFiles, onDropStrings, onLeave) {
    this.onError = onError;
    this.onHover = onHover;
    this.onDrop = onDrop;
    this.onDropFile = onDropFile;
    this.onDropString = onDropString;
    this.onDropMultiple = onDropMultiple;
    this.onDropFiles = onDropFiles;
    this.onDropStrings = onDropStrings;
    this.onDropInvalid = onDropInvalid;
    this.onLeave = onLeave;
    this.dropMIME = null;
    this.dropOperation = 'copy';
  }

  dragover_handler(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = this.dropOperation;
    if (this.onHover != null) this.onHover(event);
  }

  dragleave_handler(event) {
    event.preventDefault();
    if (this.onLeave != null) this.onLeave(event);
  }

  async drop_handler(event) {
    event.preventDefault();

    var files = [];
    var strings = [];
    var promises = [];

    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const item = event.dataTransfer.items[i];
        switch (item.kind) {
          case "file":
            if (this.dropMIME == null || this.dropMIME.includes(item.type)) {
              const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
              if (entry && entry.isDirectory) {
                promises.push(this.#traverseDirectory(entry, "", files));
              } else {
                const file = item.getAsFile();
                if (file) {
                  file.path = file.name;
                  if (this.onDrop != null) this.onDrop(event, file);
                  if (this.onDropFile != null) this.onDropFile(event, file);
                  files.push(file);
                }
              }
            }
            else {
              if (this.onDropInvalid != null) this.onDropInvalid(event, item.type);
            }
            break;

          case "string":
            promises.push(this.#getItemAsString(item).then(text => {
                if (this.onDropString != null) this.onDropString(event, text);
                strings.push(text);
            }));
            break;

          default:
            if (this.onError != null) this.onError("Wrong type: ${item.kind}");
            break;
        }
      }
    } else {
      // Fallback for browsers not supporting dataTransfer.items (rare now)
       for (let i = 0; i < event.dataTransfer.files.length; i++) {
         const file = event.dataTransfer.files[i];
         file.path = file.name;
         if (this.onDrop != null) this.onDrop(event, file);
         if (this.onDropFile != null) this.onDropFile(event, file);
         files.push(file);
       }
    }

    await Promise.all(promises);

    if (this.onDropMultiple != null) {
      if (files.length > 0) this.onDropMultiple(event, files);
      // if (strings.length > 0) this.onDropMultiple(event, strings);
    }

    if (this.onDropFiles != null && files.length > 0) this.onDropFiles(event, files);
    if (this.onDropStrings != null && strings.length > 0) this.onDropStrings(event,strings);
  }

  async #traverseDirectory(entry, path, files) {
    const reader = entry.createReader();
    const entries = await new Promise((resolve) => {
        let allEntries = [];
        function read() {
            reader.readEntries((results) => {
                if (results.length > 0) {
                    allEntries = allEntries.concat(results);
                    read();
                } else {
                    resolve(allEntries);
                }
            });
        }
        read();
    });

    for (const child of entries) {
        if (child.isDirectory) {
            await this.#traverseDirectory(child, path + entry.name + "/", files);
        } else {
            const file = await new Promise((resolve) => child.file(resolve));
            file.path = path + entry.name + "/" + child.name;
            // Trigger single file drop events? Maybe not for folder contents to avoid spam.
            // But we add to the list.
            files.push(file);
        }
    }
  }

  #getItemAsString(item) {
    return new Promise((resolve, reject) => {
      item.getAsString(function (text) {
        resolve(text);
      });
    })
  }

  setMIME(mime) {
    this.dropMIME = mime;
  }

  setOperation(operation) {
    this.dropOperation = operation;
  }
}

var flutter_dropzone_web = {
  setMIME: function(container, mime) {
    container.FlutterDropzone.setMIME(mime);
    return true;
  },

  setOperation: function(container, operation) {
    container.FlutterDropzone.setOperation(operation);
    return true;
  },

  setCursor: function(container, cursor) {
    container.style.cursor = cursor;
    return true;
  },

  create: function(container, onLoaded, onError, onHover, onDrop, onDropFile, onDropString, onDropInvalid, onDropMultiple, onDropFiles, onDropStrings, onLeave) {
    if (container.FlutterDropzone === undefined)
      container.FlutterDropzone = new FlutterDropzone(container, onLoaded, onError, onHover, onDrop, onDropFile, onDropString, onDropInvalid, onDropMultiple, onDropFiles, onDropStrings, onLeave);
    else
      container.FlutterDropzone.updateHandlers(onLoaded, onError, onHover, onDrop, onDropFile, onDropString, onDropInvalid, onDropMultiple, onDropFiles, onDropStrings, onLeave);
  },
};

window.dispatchEvent(new Event('flutter_dropzone_web_ready'));
}
