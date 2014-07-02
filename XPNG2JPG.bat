@echo off

set PROJECT_DIR=D:\newWork

set "f=%PROJECT_DIR%\source\client\gameride1"

"%PROJECT_DIR%\data\tools\xtools\XWebControler\XPNG2JPG.exe" ^
-codepage "unicode" ^
-th "10" ^
-o "%PROJECT_DIR%\data\tools\xtools\XWebControler\XPNG2JPG_output\res" ^
-qx "100" ^
-ax "100" ^
-ex "xsn" ^
-mx "xmix_" ^
-cfglabel "res" ^
-cfgcheck "1" ^
-cfgpath "%PROJECT_DIR%\source\pngquality.xml" ^
-cp "1" ^
-cprepl "data\client\www\res" ^
-cprepltk "source" ^
%f%

pause