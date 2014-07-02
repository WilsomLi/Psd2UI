前端开发流程：
1.把本目录Psd2UI拷贝到PS安装目录\Presets\Scripts下，打开Psd2UI.jsx脚本，
修改下面两处配置路径：
var sourcePath = "D:/newWork/source/client";
var resPath = "D:/newWork/data/client/www/res/client";
打开XPNG2JPG.bat.bak批处理副本文件，修改下面路径：
set PROJECT_DIR=D:\newWork
2.打开美术给的Psd(source/client_psd目录下)文件，按命名规范命名各个控件，调整层次关系，保存文件；
3.在PS里点击文件——脚本——选中PSD2UI，会打开个面板，选择需要的功能选项，点击运行开始执行脚本，
执行完毕会生成XML文件和模版代码，生成png原图文件到对应目录，打包图片到res对应目录。


美术制作规范：
1.维护公共资源uilib.psd，制作模块UI时，把图层拷贝到模块psd中，通过命名来判断是否公共资源。