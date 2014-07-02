/**
*	@author Lijia(mail:08lijia@gmail.com)
*	本脚本运行于FhotoShop CS5及以上版本，把本脚本所在目录Psd2UI放置
*   于PS安装目录\Presets\Scripts下
*
*/

///////////////////////////////////////////////////////////////////
//#target photoshop

// debug level: 0-2 (0:disable, 1:break on error, 2:break at beginning)
$.level = 0;
debugger; // launch debugger on next line

//=================================================================
// Globals
//=================================================================
var _doc;
var _psdName = "";
var _psdFolder = "";
var _moduleName = "";	//模块名
var _jsxPath = app.path + "/Presets/Scripts/Psd2UI";
var _batFileName = "XPNG2JPG.bat";
var _sourcePath = "D:/newWork/source/client";
var _resPath = "D:/newWork/data/client/www/res/client";
/******************************************************************/
var _msg = "";
var _xml = "";
var _imageIndex = 1;
var _editIndex = 1;
var _keyIndex = 1;
var _arrCtrl = [];
var _arrXML = [];
var _btnTabTxtFormat = [];
var _dicXML = new Object();
var _codeXML;
var _dicItemName = new Object();
/******************************************************************/
var CtrlMap = {wnd: 2,btn: 3,lis:4,cob: 6,edt: 7,img: 8,bg: 9,emp: 11,cls: 12,
    ric: 16,con: 17,pag: 18,stp: 19,font: 100,normalfont: 101,downfont: 102,text: 103};
var CtrlNameMap = {2:"XIWindow",3:"XIButton",4:"XIListCtrl",6:"XIComboBox",7:"XIEdit",8:"XIImageCtrl",
    9:"XIBackground",11:"XIEmptyCtrl",12:"",16:"XIRichEditList",17:"XIContainerConfig",18:"XIPaging",19:"XIPaging"};
var ArrNoNeedExport = [CtrlMap.wnd,CtrlMap.lis,CtrlMap.emp,CtrlMap.bg];
/******************************************************************/

var UILIB = "client/gameuilib";
var CONTAINER = "container";
/******************************************************************/
// ok and cancel button
var _runButtonID = 1;
var _cancelButtonID = 2;
/******************************************************************/

main();

function main() {
    try {
        if (app.documents.length <= 0 ) {
            alert("没有打开文档！");
            return "cancel";
        }
	   _doc = app.activeDocument;
        var exportInfo = new Object();
		initExportInfo(exportInfo);

        if(DialogModes.ALL == app.playbackDisplayDialogs) {
            if(_cancelButtonID == settingDialog(exportInfo)) {
                return "cancel";
            }
        }

        loadConfig();
        parseDocument();
        
        if(exportInfo.toXML) {
            ctrlToXml();
            writeXMLFile();
        }
        if(exportInfo.toCode) {
            writeCodeFile();
        }
        if(exportInfo.exportPng) {
            exportAllElementsToPNG();
        }
        if(exportInfo.packPng) {
            packPNGToRes();
        }
        		
        alert("PSD2UI执行完毕！");
		return "cancel";
    } catch(e) {
        alert("Error: " + _psdName + "(" + e.message + ")");
    }
}

function initExportInfo(exportInfo) {
    _psdFolder = String(_doc.path);
    _psdName = String(_doc.name);
	_psdName = _psdName.substr(0,_psdName.indexOf("."))
	var index = _psdFolder.lastIndexOf("/");
    _moduleName = _psdFolder.substr(index+1, _psdFolder.length);

    exportInfo.toXML = true;
    exportInfo.toCode = true;
    exportInfo.exportPng = true;
    exportInfo.packPng = true;
}

function loadConfig() {
    var jsonFile = new File(_jsxPath + "/config/xmlTemplate.xml");
    if (jsonFile == null) {
        alert("不存在xmlTemplate.xml文件");
        return;
    }
    jsonFile.open("r");
    var txt = jsonFile.readln();
    while (txt) {
        var obj = eval("(" + txt + ")");
        _arrXML[obj.type] = obj;
        txt = jsonFile.readln();
    }
    jsonFile.close();
	
	var codeFile = new File(_jsxPath + "/config/CodeTemplate.xml");
	if(codeFile == null) {
		alert("不存在CodeTemplate.xml文件");
		return;
	}
    codeFile.open("r");
	txt = codeFile.read();
	_codeXML = new XML(txt);
	codeFile.close();

    var fileName = _resPath + "/" + _moduleName + "/xml/" + _psdName + ".xml";
    var xmlFile = new File(fileName);
    if(xmlFile == null) return;
    xmlFile.open("r");
    xmlFile.encoding = "UTF-8";
    txt = xmlFile.readln();
    txt = xmlFile.read();
    var xml = new XML(txt);
    var ctrls = xml.children();
    for each(var ctrl in ctrls) {
        _dicXML[ctrl.attribute("name")] = ctrl;
    }
}

//------------------------------------------------------------------
// 对话窗口
//------------------------------------------------------------------
function settingDialog(exportInfo) {
    var dlgMain = new Window("dialog", "Psd2UI工具");
    var brush = dlgMain.graphics.newBrush (dlgMain.graphics.BrushType.THEME_COLOR, "appDialogBackground");
    dlgMain.graphics.backgroundColor = brush;
    dlgMain.graphics.disabledBackgroundColor = dlgMain.graphics.backgroundColor;
    dlgMain.orientation = 'column';
    dlgMain.alignChildren = 'left';
    // -- top of the dialog, first line
    dlgMain.add("statictext", undefined, "选项：");
    // -- two groups, one for left and one for right ok, cancel
    dlgMain.grpTop = dlgMain.add("group");
    dlgMain.grpTop.orientation = 'row';
    dlgMain.grpTop.alignChildren = 'top';
    dlgMain.grpTop.alignment = 'fill';
    // -- group top left 
    dlgMain.grpTopLeft = dlgMain.grpTop.add("group");
    dlgMain.grpTopLeft.orientation = 'column';
    dlgMain.grpTopLeft.alignChildren = 'left';
    dlgMain.grpTopLeft.alignment = 'fill';
    dlgMain.cbToXML = dlgMain.grpTopLeft.add("checkbox", undefined, "生成XML");
    dlgMain.cbToXML.value = exportInfo.toXML;
    dlgMain.cbToCode = dlgMain.grpTopLeft.add("checkbox", undefined, "生成模版代码");
    dlgMain.cbToCode.value = exportInfo.toCode;
    dlgMain.cbExportPng = dlgMain.grpTopLeft.add("checkbox", undefined, "导出PNG图");
    dlgMain.cbExportPng.value = exportInfo.exportPng;
    dlgMain.cbPackPng = dlgMain.grpTopLeft.add("checkbox", undefined, "打包PNG图");
    dlgMain.cbPackPng.value = exportInfo.packPng;

    // the right side of the dialog, the ok and cancel buttons
    dlgMain.grpTopRight = dlgMain.grpTop.add("group");
    dlgMain.grpTopRight.orientation = 'column';
    dlgMain.grpTopRight.alignChildren = 'fill';
    dlgMain.btnRun = dlgMain.grpTopRight.add("button", undefined, "运行" );
    dlgMain.btnRun.onClick = function() {
        dlgMain.close(_runButtonID);
    }
    dlgMain.btnCancel = dlgMain.grpTopRight.add("button", undefined, "取消" );
    dlgMain.btnCancel.onClick = function() { 
        dlgMain.close(_cancelButtonID); 
    }
    dlgMain.defaultElement = dlgMain.btnRun;
    dlgMain.cancelElement = dlgMain.btnCancel;

    // the bottom of the dialog
    dlgMain.grpBottom = dlgMain.add("group");
    dlgMain.grpBottom.orientation = 'column';
    dlgMain.grpBottom.alignChildren = 'left';
    dlgMain.grpBottom.alignment = 'fill';
    dlgMain.pnlHelp = dlgMain.grpBottom.add("panel");
    dlgMain.pnlHelp.alignment = 'fill';
    dlgMain.etHelp = dlgMain.pnlHelp.add("statictext", undefined, "请根据规范对PSD和图层进行命名", {multiline:true});
    dlgMain.etHelp.alignment = 'fill';

     // give the hosting app the focus before showing the dialog
    app.bringToFront();
    dlgMain.center();
    var result = dlgMain.show();
    
    if (_cancelButtonID == result) {
        return result;  // close to quit
    }
    // get setting from dialog
    exportInfo.toXML = dlgMain.cbToXML.value;
    exportInfo.toCode = dlgMain.cbToCode.value;
    exportInfo.exportPng = dlgMain.cbExportPng.value;
    exportInfo.packPng = dlgMain.cbPackPng.value;
    return result;
}

//------------------------------------------------------------------
// 解析PSD文件
//------------------------------------------------------------------
function parseDocument() {
    var layers = _doc.layers;
    var len = layers.length;
    for (var i = 0; i < len; i++) {
        parseLayer(layers[i]);
    }
}

function parseLayer(element) {
    if (element.typename == "ArtLayer") {
        parseElement(element);
    } else {
        var layers = element.layers;
        var len = layers.length;
        var layer;
        for (var i = 0; i < len; i++) {
            layer = layers[i];
            if (layer.typename == "ArtLayer") {
                parseElement(layer);
            } else {
                parseLayer(layer);
            }
			if(i == len-1 && element.name.indexOf(CONTAINER) == 0) {
				parseElement(element);
			}
        }
    }
}

function parseElement(element) {
    var result;
    if (element.kind == LayerKind.TEXT) {
        result = atomParseTextElement(element);
    } else {
        result = parseCtrl(element);
    }
    if (result == null) return;
    _arrCtrl.push(result);
}

function parseCtrl(element) {
	var result = new Object();
    var rect = getRectObject(element);
    result.x = rect.x;
    result.y = rect.y;
    result.width = rect.width;
    result.height = rect.height;
    result.name = element.name;
	result.containerName = getContainerName(element);
    result.type = getCtrlType(element);

    var arrParam = element.name.split("_");
    result.arrParam = arrParam;
	var layer;
	var len;
    switch (result.type) {
    case CtrlMap.wnd:
		if(arrParam.length == 2) {
			result.background = arrParam[1];
		}
        break;
    case CtrlMap.cob:
        break;
    case CtrlMap.edt:
        break;
    case CtrlMap.btn:
        result.pack = "client/" + _moduleName;
        result.name = arrParam[0];
        result.image = "img/" + _psdName + "/" + result.name + ".xsn";
		if(arrParam.length == 3) {
			result.image = arrParam[1] + ".xsn";
			result.pack = arrParam[2];
		}
        if (element.parent && element.parent.typename == "LayerSet") {
            len = element.parent.layers.length;
            for (var i = 0; i < len; i++) {
                layer = element.parent.layers[i];
                if (layer.kind == LayerKind.TEXT) {
                    result.btnLabel = layer.textItem.contents;
                    result.format = parseTextDefaultTextFormat(layer.textItem);
                    break;
                }
            }
        }
        break;
	case CtrlMap.lis:
		if (element.parent && element.parent.typename == "LayerSet") {
            len = element.parent.layers.length;
            for (var i = 0; i < len; i++) {
                layer = element.parent.layers[i];
                if (layer.typename == "LayerSet") {
					layer = layer.layers[layer.layers.length - 1];
					rect = getRectObject(layer);
					result.itemwidth = rect.width;
					result.itemheight = rect.height;
                    break;
                }
            }
        }
		break;
    case CtrlMap.img:
        result.pack = "client/" + _moduleName;
        result.name = arrParam[0];
        result.image = "img/" + _psdName + "/" + result.name + ".xsn";
        break;
    case CtrlMap.bg:
        if (arrParam.length == 1) {
            result.image = "img/wndtemplate/" + result.name + ".xsn";
            result.pack = UILIB;
        } else {
            result.imgage = arrParam[1];
            if (arrParam.length == 3) {
                result.pack = arrParam[2];
            }
        }
        break;
    case CtrlMap.emp:
        //result.position = element.name.substr(index+1,element.name.length).toUpperCase();
        break;
    case CtrlMap.cls:
        break;
    case CtrlMap.ric:
        break;
    case CtrlMap.con:
		result.name = arrParam[0];
        if(arrParam.length == 2) {
            _dicItemName[arrParam[0]] = arrParam[1];    
        }
        break;
    case CtrlMap.pag:
        break;
    case CtrlMap.stp:
        break;
    default:
        break;
    }

    return result;
}

function getCtrlType(element) {
    for (var type in CtrlMap) {
        if (element.name.indexOf(type) == 0) {
            return CtrlMap[type];
        }
    }
    return CtrlMap.img; //默认图片格式
}

function getContainerName(element) {
	var parent = element.parent;
	if (parent && parent.typename == "LayerSet") {
		if(parent.name.indexOf(CONTAINER) == 0) {
			var arrParam = parent.name.split("_");
			return arrParam[0];
		}
	}
	return "";
}

function getRectObject(element) {
	var rect = element.bounds;
    var result = new Object();
    result.x = rect[0].value;
    result.y = rect[1].value;
    result.width = rect[2].value - result.x;
    result.height = rect[3].value - result.y;
	return result;
}

function ctrlToXml() {
    var len = _arrCtrl.length;
    for (var i = len - 1; i >= 0; i--) {
        objectToXml(_arrCtrl[i]);
    }
}

function objectToXml(obj) {
    var ctrl = _arrXML[obj.type];
    if (ctrl == null) return;
	ctrl.name = obj.name;
    //设置已有属性值
    var xmlAttribute = _dicXML[ctrl.name];
    if(xmlAttribute) {
        for(var key in ctrl) {
            ctrl[key] = xmlAttribute.attribute(key);
        }
    }
    
    ctrl.x = obj.x;
    ctrl.y = obj.y;
    ctrl.width = obj.width;
    ctrl.height = obj.height;
	ctrl.containerName = obj.containerName;
    switch (obj.type) {
    case CtrlMap.wnd:
		if(obj.background) {
			ctrl.background = obj.background;
		}
        break;
	case CtrlMap.img:
    case CtrlMap.bg:
	case CtrlMap.btn:
		ctrl.pack = obj.pack;
		ctrl.image = obj.image;
        break;
    case CtrlMap.cob:
        break;
    case CtrlMap.edt:
        break;
	case CtrlMap.lis:
		ctrl.itemwidth = obj.itemwidth;
		ctrl.itemheight = obj.itemheight;
		break;
    case CtrlMap.emp:
        break;
    case CtrlMap.cls:
        break;
    case CtrlMap.ric:
        break;
    case CtrlMap.con:
        break;
    case CtrlMap.pag:
        break;
    case CtrlMap.stp:
        break;
    default:
        break;
    }

    _xml += "\t<ctrl key=\"".concat(_keyIndex++, "\" ");
    
    for (var key in ctrl) {
        _xml += key.concat("=\"" , ctrl[key], "\" ");
    }
    if (obj.type == CtrlMap.btn) //btn 
    {
        _xml += ">\n";
        _xml += parseBtnCtrl(obj);
        _xml += "\t</ctrl>\n";
    } else if (obj.type == CtrlMap.edt) {
        _xml += ">\n";
        _xml += parseEdtCtrl(obj);
        _xml += "\t</ctrl>\n";
    } else if (obj.type == CtrlMap.cob || obj.type == CtrlMap.pag || obj.type == CtrlMap.stp || obj.type == CtrlMap.ric) {
        _xml += ">\n";
        _xml += addFontProperty();
        _xml += "</ctrl>\n";
    } else {
        _xml += "/>\n";
    }
}

function parseEdtCtrl(obj) {
    var format = obj.format;
    if (format == null) return;
    var str = "\t\t<text language=\"true\"><![CDATA[" + obj.content + "]]></text>\n";
    var fontPro = _arrXML[CtrlMap.font];
    var fontObj = new Object();
    for (var key in fontPro) {
        fontObj[key] = fontPro[key];
    }
    fontObj.size = format.size;
    fontObj.bold = format.bold;
    fontObj.italic = format.italic;
    fontObj.color = format.color;
    str += "\t\t<font ";
    for (var key in fontObj) {
        if (key != "type" && key != "name") str += key + "=\"" + fontObj[key] + "\" ";
    }
    str += "/>\n";
    //alert(str)
    return str;
}

function addFontProperty() {
    var str = "<font ";
    var fontPro = _arrXML[CtrlMap.font];
    for (var key in fontPro) {
        if (key != "type" && key != "name") str += key + "=\"" + fontPro[key] + "\" ";
    }
    str += "/>\n";
    return str;
}

function parseBtnCtrl(obj) {
    var str = "";
    if (obj.btnLabel != null) {
        str += "\t\t<text language=\"true\"><![CDATA[" + obj.btnLabel + "]]></text>\n";
    }
    var normalfontPro = _arrXML[CtrlMap.normalfont];
    str += "\t\t<normalfont ";
    var val;
    for (var key in normalfontPro) {
        if (key != "type" && key != "name") {
            val = obj.format ? obj.format[key] : normalfontPro[key];
            str += key + "=\"" + val + "\" ";
        }
    }
    str += "/>\n";
    var downfontPro = clone(_arrXML[CtrlMap.downfont]);
    str += "\t\t<downfont ";
    for (var key in downfontPro) {
        if (key != "type" && key != "name") {
            val = obj.format ? obj.format[key] : normalfontPro[key];
            str += key + "=\"" + val + "\" ";
        }
    }
    str += "/>\n";
    return str;
}

function atomParseTextElement(element) {
    if (element.kind != LayerKind.TEXT) {
        return;
    }
    if (element.parent && element.parent.name.indexOf("btn") == 0) return;
    var result = new Object();
    if (element.name.indexOf("edt") != -1) {
        result.name = element.name;
    } else {
        result.name = "edit" + _editIndex++;
    }
	result.containerName = getContainerName(element);

    result.type = CtrlMap.edt;
    result.content = "";
    result.rawContent = "";
    var textItem = element.textItem;
    if (textItem == null) return;
    result.format = parseTextDefaultTextFormat(textItem);

    result.content = textItem.contents;
    if (result.content) {
        var content = result.content;
        if (result.format.underline == true) {
            content = "<u>" + content + "</u>";
        }
        if (result.format.bold == true) {
            content = "<b>" + content + "</b>";
        }
        content = "<font color='" + result.format.color + "'>" + content + "</font>";
        result.rawContent = content;
    }
   var rect = getRectObject(element);
    result.x = rect.x;
    result.y = rect.y;
    result.width = rect.width;
    result.height = rect.height;
    return result;
}

function parseTextDefaultTextFormat(textItem) {
    var result = new Object();
	result.border = true;
    result.align = textItem.justification; 
    result.bold = textItem.fauxBold;
    result.color = parseInt("0x" + textItem.color.rgb.hexValue);
    result.font = textItem.font;
    result.italic = textItem.fauxItalic;
    result.size = textItem.size.value;
    result.height = result.size / 72 * 96;
    result.letterSpacing = textItem.leading.value;
    result.leading = textItem.leading.value;
    result.underline = textItem.underline != UnderlineType.UNDERLINEOFF;
    return result;
}

function parseFontSize(sizeStr) {
    var result = sizeStr.replace("pt", "");
    return parseInt(result);
}

function refineTextElementWidth(textObj, textAttrs) {
    var result = textObj.width;
    var rawContent = textObj.rawContent;
    var kerning = textAttrs.rangeKerning;
    var refinedKerning = Math.round(kerning);
    var lineList = rawContent.split("\\r");
    var len = lineList != null ? lineList.length: 0;
    var maxCharNum = 0;
    for (var i = 0; i < len; i++) {
        var line = lineList[i];
        if (line.length > maxCharNum) {
            maxCharNum = line.length;
        }
    }
    result += (refinedKerning - kerning) * maxCharNum;
    result = Math.ceil(result);
    return result;
}

/*****************************************************************************************************
* Output  File
*****************************************************************************************************/
function writeXMLFile() {
    //
    var _xmlResult = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>\n".concat(_xml, "</root>");
    var path = _resPath + "/" + _moduleName + "/xml";
    writeFile(path, _psdName + ".xml", _xmlResult);
}

function writeCodeFile() {
	var path = _resPath + "/" + _moduleName + "/xml";
	var codeObj = getSaveCodeObj ();
	var fileName = "Wnd" + _moduleName +".as"
	var code = codeObj.wnd;
	writeFile(path, fileName, code);
	
	var itemObj = codeObj.item;
	for(var name in itemObj) {
		writeFile(path, name + ".as", itemObj[name]);
	}
}

function getSaveCodeObj()
{
	var result = new Object();
	var code = "";
	var num = _arrCtrl.length;
	var ctrl;
	var ctrlName = "";
	var arrWndCtrl = [];
	var dicSubCtrl = new Object();
	for(var i = 0; i < num; i ++) {
		ctrl = _arrCtrl[i];
		if(ctrl.containerName == "") {
			arrWndCtrl.push(ctrl);
		}else {
			//container容器里
			if(dicSubCtrl[ctrl.containerName] == null) {
				dicSubCtrl[ctrl.containerName] = new Array();
			}
			dicSubCtrl[ctrl.containerName].push(ctrl);
		}
	}
	
	var declare = "";
	var initCtrl = "";
	var onBtnHandle = "";
	var destroy = "";
	var xi;
	var handle = "";
	for each(ctrl in arrWndCtrl) {
		ctrlName = ctrl.name;
		if(ctrl.type == CtrlMap.btn) {
			handle = ctrlName == "btnClose" ? "Destroy();\r\n\t\t\t\t\t" : "";
			onBtnHandle = onBtnHandle.concat("case \"",ctrlName,"\":\r\n\t\t\t\t\t",handle,"break;","\r\n\t\t\t\t");
			continue;
		}
		xi = CtrlNameMap[ctrl.type];
		declare = declare.concat("private var m_",ctrlName,":",xi,";\r\n\t\t");
		destroy = destroy.concat("m_",ctrlName," = null;","\r\n\t\t\t");
		if(ctrl.type == CtrlMap.emp) {
			initCtrl = initCtrl.concat("m_",ctrlName," = m_Wnd.FindEmptyCtrl(\"",ctrlName,"\");","\r\n\t\t\t");
		}else {
			initCtrl = initCtrl.concat("m_",ctrlName," = m_Wnd.FindChildCtrl(\"",ctrlName,"\") as ",xi,";\r\n\t\t\t");
		}
	}
	code = String(_codeXML.wnd).replace("[declare]",declare);
	code = code.replace("[destroy]",destroy);
	code = code.replace("[initCtrl]",initCtrl);
	code = code.replace("[onBtnHandle]",onBtnHandle);
	result.wnd = code;
	
	result.item = new Object();
	var con;
	var itemName;
	for(var key in dicSubCtrl) {
		con = dicSubCtrl[key];
		itemName = _dicItemName[key];
		declare = initCtrl = destroy = onBtnHandle = "";
		for each(ctrl in con) {
			ctrlName = ctrl.name;
			if(ctrl.type == CtrlMap.btn) {
				onBtnHandle = onBtnHandle.concat("case \"",ctrlName,"\":\r\n\t\t\t\t\t","break;","\r\n\t\t\t\t");
			}
			xi = CtrlNameMap[ctrl.type];
			declare = declare.concat("private var m_",ctrlName,":",xi,";\r\n\t\t");
			destroy = destroy.concat("m_",ctrlName," = null;","\r\n\t\t\t");
			if(ctrl.type == CtrlMap.emp) {
				initCtrl = initCtrl.concat("m_",ctrlName," = container.FindEmptyCtrl(\"",ctrlName,"\");","\r\n\t\t\t");
			}else {
				initCtrl = initCtrl.concat("m_",ctrlName," = FindChildCtrl(\"",ctrlName,"\") as ",xi,";\r\n\t\t\t");
				if(ctrl.type == CtrlMap.btn) {
					initCtrl = initCtrl.concat("m_",ctrlName,".SetClickCallback(OnButtonClick);","\r\n\t\t\t");
				}
			}
		}
		code = String(_codeXML.item).replace("[declare]",declare);
		code = code.replace("[destroy]",destroy);
		code = code.replace("[initCtrl]",initCtrl);
		var btnHandle = "";
		if(onBtnHandle.length > 0) {
			btnHandle = String(_codeXML.btnHandle);
			btnHandle = btnHandle.replace("[onBtnHandle]",onBtnHandle);
		}
		code = code.replace("[btnHandle]",btnHandle);
		result.item[itemName] = code;
	}

	return result;
}

/*****************************************************************************************************
* Export PNG
*****************************************************************************************************/
function exportAllElementsToPNG() {
    var myDocument = app.activeDocument;
	var duppedDocumentTmp = myDocument.duplicate(); //副本
    var theLayers = collectVisibleLayers(duppedDocumentTmp, []);
    // create a history state;
	var theState = duppedDocumentTmp.activeHistoryState;

    var path = _sourcePath + "/" + _moduleName + "/img/" + _psdName;
    createInexistentFolder(path);
    // process the visible layers;
    for (var m = 0; m < theLayers.length; m++) {
        var theLayer = theLayers[m];
        duppedDocumentTmp.artLayers.add();
        hideOthers(theLayer, duppedDocumentTmp);
        deleteHiddenLayers();
        savePNG(duppedDocumentTmp, path, theLayer.name);
        duppedDocumentTmp.activeHistoryState = theState;
    };
	duppedDocumentTmp.close(SaveOptions.DONOTSAVECHANGES);
}

///// function to png //////
function savePNG(myDocument, _docPath, basename) {
	var index = basename.indexOf("_");
	if(index != -1) {
		basename = basename.substr(0,index);
	}
	
    var saveFile = File(_docPath + "/" + basename + ".png");
    if (saveFile.exists) {
        saveFile.remove();
    }
    app.activeDocument.trim(TrimType.TRANSPARENT); //去除空白处
    // weboptions;
    var webOptions = new ExportOptionsSaveForWeb();
    webOptions.format = SaveDocumentType.PNG;
    webOptions.PNG8 = false;
    webOptions.transparency = true;
    webOptions.interlaced = false;
    webOptions.includeProfile = false;
    myDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, webOptions);
};
////// function collect all layers //////
function collectVisibleLayers(theParent, allLayers) {
    if (!allLayers) {
        var allLayers = new Array;
    }
    var len = theParent.layers.length;
    for (var m = len - 1; m >= 0; m--) {
        var theLayer = theParent.layers[m];
        if (theLayer.typename == "ArtLayer") {
            if (isNeedExportLayer (theLayer)) {
                allLayers.push(theLayer);
            }
        } else {
            allLayers = (collectVisibleLayers(theLayer, allLayers)); // apply the function to layersets;
        }
    };
    return allLayers
};
////// is need export layer //////
function isNeedExportLayer(layer) {
	if(layer.kind == LayerKind.TEXT || layer.visible == false) return false;
	var type = getCtrlType(layer);
	for each(var val in ArrNoNeedExport) {
		if(val == type) return false;
	}
    var arrParam = layer.name.split("_");
    if(arrParam.length > 1) {
        return false;//公共资源不导出
    }
	return true;
}
////// delete hidden layers //////
function deleteHiddenLayers() {
    try {
        var id26 = charIDToTypeID("Dlt ");
        var desc6 = new ActionDescriptor();
        var id27 = charIDToTypeID("null");
        var ref6 = new ActionReference();
        var id28 = charIDToTypeID("Lyr ");
        var id29 = charIDToTypeID("Ordn");
        var id30 = stringIDToTypeID("hidden");
        ref6.putEnumerated(id28, id29, id30);
        desc6.putReference(id27, ref6);
        executeAction(id26, desc6, DialogModes.NO);
    } catch(e) {}
};
////// toggle visibility of others //////
function hideOthers(theLayer, myDocument) {
    myDocument.activeLayer = theLayer;
    // =======================================================
    var idShw = charIDToTypeID("Shw ");
    var desc10 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var list4 = new ActionList();
    var ref7 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref7.putEnumerated(idLyr, idOrdn, idTrgt);
    list4.putReference(ref7);
    desc10.putList(idnull, list4);
    var idTglO = charIDToTypeID("TglO");
    desc10.putBoolean(idTglO, true);
    executeAction(idShw, desc10, DialogModes.NO);
};

/*****************************************************************************************************
* Pack PNG To Res Folder
*****************************************************************************************************/
function packPNGToRes() {
    var file = new File(_jsxPath + "/" + _batFileName + ".bak");
    var newFile = new File(_jsxPath + "/" + _batFileName);
    if (file) {
        file.open("r");
        var text = file.read();
        text = text.replace(/(f=%PROJECT_DIR%\\source\\client\\)(\w+)/, '$1' + _moduleName);
        file.close();

        newFile.open("w");
        newFile.write(text);
        newFile.close();
    }
    executeBatFile(_jsxPath, _batFileName);
}

/*****************************************************************************************************
* API  Function
*****************************************************************************************************/
function writeFile(folderPath, fileName, _msg) {
    createInexistentFolder(folderPath);
    var absolutePath = folderPath + "/" + fileName;
    var file = new File(absolutePath);
    if (file) {
        file.remove();
        file.open("w");
        file.encoding = "UTF-8";
        file.write(_msg);
        file.close();
    } else {
        alert("Write XML Error")
    }
}

function createInexistentFolder(path) {
    var folder = new Folder(path);
    if (!folder.exists) {
        if (folder.create() == false) {
            alert("创建路径" + path + "失败! 请检查路径是否存在。");
        }
    }
}

function executeBatFile(path, batName) {
    var batFile = new File(path + "/" + batName);
    if (!batFile) {
        alert(_batFileName + "文件不存在于对应目录");
        return;
    }
    batFile.close();
    batFile.execute();
}

//复制对象
function clone(myObj) {
    if (typeof(myObj) != 'object') return myObj;
    if (myObj == null) return myObj;
    var myNewObj = new Object();
    for (var i in myObj) myNewObj[i] = clone(myObj[i]);
    return myNewObj;
}