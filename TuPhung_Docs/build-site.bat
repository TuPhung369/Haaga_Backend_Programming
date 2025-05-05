@echo off
echo Cleaning cache...
rmdir /s /q .docusaurus
rmdir /s /q node_modules\.cache

echo Building site with no-minify option...
call npm run build -- --no-minify

echo Starting server...
call npm run serve