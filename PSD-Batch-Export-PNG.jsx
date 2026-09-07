#target photoshop

app.displayDialogs = DialogModes.NO;

// User-visible strings are written as \u escapes so the .jsx stays ASCII-safe
// regardless of how Photoshop reads the file encoding.
var TXT = {
    title: "PSD \u6279\u91cf\u5bfc\u51fa PNG",
    notice: "\u5c06\u6bcf\u4e2a PSD \u7684\u5f53\u524d\u663e\u793a\u6548\u679c\uff08\u53ef\u89c1\u56fe\u5c42\u5408\u5c42\uff09\u5bfc\u51fa\u4e3a PNG\uff0c\u4e0d\u4fee\u6539\u539f\u6587\u4ef6\u3002",
    srcLabel: "\u6e90\u6587\u4ef6\u5939\uff1a",
    browse: "\u6d4f\u89c8",
    srcDialog: "\u8bf7\u9009\u62e9\u5305\u542b PSD \u7684\u6587\u4ef6\u5939",
    outLabel: "\u8f93\u51fa\u6587\u4ef6\u5939\uff1a",
    autoLabel: "\u8f93\u51fa\u5230\u6e90\u6587\u4ef6\u5939\u4e0b\u7684 png \u5b50\u76ee\u5f55",
    outDialog: "\u8bf7\u9009\u62e9\u8f93\u51fa\u6587\u4ef6\u5939",
    recurseLabel: "\u5305\u542b\u5b50\u6587\u4ef6\u5939\uff08\u8f93\u51fa\u7ed3\u6784\u4fdd\u6301\u6e90\u6587\u4ef6\u5939\u7ed3\u6784\uff09",
    start: "\u5f00\u59cb\u5bfc\u51fa",
    exit: "\u9000\u51fa",
    initial: "\u8bf7\u9009\u62e9\u6e90\u6587\u4ef6\u5939\u540e\u70b9\u51fb\u201c\u5f00\u59cb\u5bfc\u51fa\u201d",
    exporting: "\u6b63\u5728\u5bfc\u51fa",
    doneTitle: "\u5bfc\u51fa\u5b8c\u6210",
    success: "\u6210\u529f",
    failure: "\u5931\u8d25",
    outDir: "\u8f93\u51fa\u76ee\u5f55",
    errInfo: "\u9519\u8bef\u4fe1\u606f\uff08\u6700\u591a 3 \u6761\uff09",
    noSource: "\u8bf7\u5148\u9009\u62e9\u6e90\u6587\u4ef6\u5939\u3002",
    noOutput: "\u8bf7\u9009\u62e9\u8f93\u51fa\u6587\u4ef6\u5939\u3002",
    noPsd: "\u6240\u9009\u6587\u4ef6\u5939\u4e2d\u6ca1\u6709\u627e\u5230 .psd \u6587\u4ef6\u3002",
    cannotCreate: "\u65e0\u6cd5\u521b\u5efa\u8f93\u51fa\u6587\u4ef6\u5939\uff1a",
    errorTitle: "\u9519\u8bef",
    countUnit: "\u4e2a"
};

function collectPsd(folder, outFolder, tasks, recurse) {
    var entries = folder.getFiles();
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry instanceof Folder) {
            if (recurse) {
                var childOut = new Folder(outFolder.fsName + "/" + entry.name);
                if (!childOut.exists) {
                    childOut.create();
                }
                collectPsd(entry, childOut, tasks, true);
            }
        }
        else if (entry instanceof File) {
            if (/\.psd$/i.test(entry.name)) {
                tasks.push({ src: entry, out: outFolder });
            }
        }
    }
}

function exportOne(srcFile, outFolder) {
    var doc = null;
    var copy = null;
    try {
        var outFile = new File(
            outFolder.fsName + "/" + srcFile.name.replace(/\.psd$/i, ".png")
        );
        doc = app.open(srcFile);
        copy = doc.duplicate();
        var opts = new PNGSaveOptions();
        opts.compression = 6;
        opts.interlaced = false;
        copy.saveAs(outFile, opts, true, Extension.LOWERCASE);
        return { ok: true, err: "" };
    }
    catch (e) {
        return { ok: false, err: srcFile.name + " -> " + String(e) };
    }
    finally {
        if (copy) {
            try { copy.close(SaveOptions.DONOTSAVECHANGES); } catch (e2) {}
        }
        if (doc) {
            try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch (e3) {}
        }
    }
}

function buildDialog() {
    var win = new Window("dialog", TXT.title);
    win.orientation = "column";
    win.alignChildren = "left";
    win.preferredSize.width = 720;

    var notice = win.add("statictext", undefined, TXT.notice);
    notice.preferredSize.width = 700;

    var rowSource = win.add("group");
    rowSource.orientation = "row";
    var lblSource = rowSource.add("statictext", undefined, TXT.srcLabel);
    lblSource.preferredSize.width = 130;
    var srcEdit = rowSource.add("edittext", undefined, "");
    srcEdit.preferredSize.width = 420;
    var btnSource = rowSource.add("button", undefined, TXT.browse);

    var autoCheck = win.add("checkbox", undefined, TXT.autoLabel);
    autoCheck.value = true;

    var rowOutput = win.add("group");
    rowOutput.orientation = "row";
    var lblOutput = rowOutput.add("statictext", undefined, TXT.outLabel);
    lblOutput.preferredSize.width = 130;
    var outEdit = rowOutput.add("edittext", undefined, "");
    outEdit.preferredSize.width = 420;
    var btnOutput = rowOutput.add("button", undefined, TXT.browse);
    outEdit.enabled = false;
    btnOutput.enabled = false;

    var recurseCheck = win.add("checkbox", undefined, TXT.recurseLabel);
    recurseCheck.value = false;

    var progress = win.add("progressbar", undefined, 0, 1);
    progress.preferredSize.width = 700;
    progress.value = 0;

    var status = win.add("statictext", undefined, TXT.initial);
    status.preferredSize.width = 700;

    var rowButtons = win.add("group");
    rowButtons.alignment = "right";
    var btnStart = rowButtons.add("button", undefined, TXT.start);
    var btnExit = rowButtons.add("button", undefined, TXT.exit);

    btnSource.onClick = function () {
        var picked = Folder.selectDialog(TXT.srcDialog);
        if (picked) {
            srcEdit.text = picked.fsName;
            if (autoCheck.value) {
                outEdit.text = new Folder(picked.fsName + "/png").fsName;
            }
        }
    };

    btnOutput.onClick = function () {
        var picked = Folder.selectDialog(TXT.outDialog);
        if (picked) {
            outEdit.text = picked.fsName;
        }
    };

    autoCheck.onClick = function () {
        if (autoCheck.value) {
            outEdit.enabled = false;
            btnOutput.enabled = false;
            if (srcEdit.text.length > 0) {
                outEdit.text = new Folder(srcEdit.text + "/png").fsName;
            }
        }
        else {
            outEdit.enabled = true;
            btnOutput.enabled = true;
        }
    };

    function runExport() {
        var srcText = srcEdit.text.replace(/^\s+|\s+$/g, "");
        if (srcText.length === 0) {
            alert(TXT.noSource, TXT.errorTitle);
            return;
        }

        var sourceFolder = new Folder(srcText);
        if (!sourceFolder.exists) {
            alert(TXT.noSource, TXT.errorTitle);
            return;
        }

        var outRoot;
        if (autoCheck.value) {
            outRoot = new Folder(sourceFolder.fsName + "/png");
        }
        else {
            var outText = outEdit.text.replace(/^\s+|\s+$/g, "");
            if (outText.length === 0) {
                alert(TXT.noOutput, TXT.errorTitle);
                return;
            }
            outRoot = new Folder(outText);
        }

        if (!outRoot.exists && !outRoot.create()) {
            alert(TXT.cannotCreate + outRoot.fsName, TXT.errorTitle);
            return;
        }

        var tasks = [];
        collectPsd(sourceFolder, outRoot, tasks, recurseCheck.value);

        if (tasks.length === 0) {
            alert(TXT.noPsd, TXT.errorTitle);
            return;
        }

        btnStart.enabled = false;
        btnExit.enabled = false;
        progress.maxvalue = tasks.length;
        progress.value = 0;

        var okCount = 0;
        var errors = [];

        for (var i = 0; i < tasks.length; i++) {
            status.text = TXT.exporting + " (" + (i + 1) + "/" + tasks.length +
                "): " + tasks[i].src.name;
            progress.value = i;
            win.update();

            var result = exportOne(tasks[i].src, tasks[i].out);
            if (result.ok) {
                okCount++;
            }
            else {
                errors.push(result.err);
            }

            progress.value = i + 1;
            win.update();
        }

        var msg = TXT.doneTitle + "\n\n" +
            TXT.success + ": " + okCount + " " + TXT.countUnit + "\n" +
            TXT.failure + ": " + errors.length + " " + TXT.countUnit + "\n" +
            TXT.outDir + ": " + outRoot.fsName;

        if (errors.length > 0) {
            msg += "\n\n" + TXT.errInfo + "\n";
            var shown = Math.min(3, errors.length);
            for (var j = 0; j < shown; j++) {
                msg += "- " + errors[j] + "\n";
            }
        }

        win.close();
        alert(msg, TXT.doneTitle);
    }

    btnStart.onClick = runExport;
    btnExit.onClick = function () {
        win.close();
    };

    win.defaultElement = btnStart;
    win.cancelElement = btnExit;

    return win;
}

var dialog = buildDialog();
dialog.center();
dialog.show();
