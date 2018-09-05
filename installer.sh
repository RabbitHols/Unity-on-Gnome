#!/bin/sh

sudo add-apt-repository universe
sudo apt update


sudo apt install git gnome-tweak-tool gir1.2-clutter-1.0 gir1.2-clutter-gst-3.0 gir1.2-gtkclutter-1.0 -y
sudo apt install git -y

#Dependency needed for global menu
sudo apt install unity-gtk2-module unity-gtk3-module -y
sudo apt install x11-utils -y

#Needed to recompile gschema of gnome extension with custom default settings
sudo apt-get install libglib2.0-dev -y


git clone https://github.com/RabbitHols/Power-Gnome $HOME/Power-Gnome


sudo cp -r $HOME/Power-Gnome/src/style/themes/* /usr/share/themes
sudo cp -r $HOME/Power-Gnome/src/style/icons/* /usr/share/icons
sudo cp -r $HOME/Power-Gnome/src/style/cursor/* /usr/share/icons

sudo cp -r $HOME/Power-Gnome/src/style/themes/* /usr/share/themes
sudo cp -r $HOME/Power-Gnome/src/style/icons/* /usr/share/icons
sudo cp -r $HOME/Power-Gnome/src/style/cursor/* /usr/share/icons


mkdir $HOME/.local/share/gnome-shell/extensions

sudo yes | cp -rf $HOME/Power-Gnome/src/tweak_extension/user-theme@gnome-shell-extensions.gcampax.github.com $HOME/.local/share/gnome-shell/extensions
sudo yes | cp -rf $HOME/Power-Gnome/src/tweak_extension/activities-config@nls1729 $HOME/.local/share/gnome-shell/extensions

sudo mkdir -p ~/.local/share/gnome-shell/extensions/

#Global Menu
git clone https://gitlab.com/lestcape/Gnome-Global-AppMenu
sudo yes | cp -rf Gnome-Global-AppMenu/gnomeGlobalAppMenu@lestcape ~/.local/share/gnome-shell/extensions/
sudo rm -rf Gnome-Global-AppMenu

sudo rm ~/.local/share/gnome-shell/extensions/gnomeGlobalAppMenu@lestcape/settings-schema.json
sudo cp $HOME/Power-Gnome/src/tweak_extension/gnomeGlobalAppMenu@lestcape/settings-schema.json ~/.local/share/gnome-shell/extensions/gnomeGlobalAppMenu@lestcape/


#Unite
sudo yes | cp -rf $HOME/Power-Gnome/src/tweak_extension/unite@hardpixel.eu ~/.local/share/gnome-shell/extensions/
sudo cp $HOME/Power-Gnome/src/scripts/* /usr/bin
sudo chmod +x /usr/bin/extension-enabler

extension-enabler -e user-theme@gnome-shell-extensions.gcampax.github.com
extension-enabler -e activities-config@nls1729
extension-enabler -e unite@hardpixel.eu
extension-enabler -e gnomeGlobalAppMenu@lestcape

sudo cp $HOME/.local/share/gnome-shell/extensions/user-theme@gnome-shell-extensions.gcampax.github.com/schemas/org.gnome.shell.extensions.user-theme.gschema.xml /usr/share/glib-2.0/schemas && sudo glib-compile-schemas /usr/share/glib-2.0/schemas

gsettings set org.gnome.desktop.interface gtk-theme "PowerGnomeGtk" 
gsettings set org.gnome.shell.extensions.user-theme name "PowerGnomeShell"
gsettings set org.gnome.desktop.interface icon-theme 'power-gnome-icons'
gsettings set org.gnome.desktop.interface cursor-theme "power-gnome-cursor"

dconf reset -f /org/gnome/shell/extensions/dash-to-dock/
gsettings set org.gnome.shell.extensions.dash-to-dock show-apps-at-top true
gsettings set org.gnome.shell.extensions.dash-to-dock custom-theme-shrink false

gsettings set org.gnome.desktop.wm.preferences button-layout 'close,maximize,minimize:'
gsettings set org.gnome.shell.extensions.dash-to-dock dash-max-icon-size 30


sudo mv $HOME/Power-Gnome/src/style/wallpaper/powerGnome.png /usr/share/backgrounds/warty-final-ubuntu.png
gsettings set org.gnome.desktop.background picture-uri file:////usr/share/backgrounds/warty-final-ubuntu.png

#Adjust schema error

sudo cp $HOME/.local/share/gnome-shell/extensions/activities-config@nls1729/schemas/org.gnome.shell.extensions.activities-config.gschema.xml /usr/share/glib-2.0/schemas/ 
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/

sudo cp $HOME/.local/share/gnome-shell/extensions/unite@hardpixel.eu/schemas/org.gnome.shell.extensions.unite.gschema.xml /usr/share/glib-2.0/schemas/ 
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/

sudo rm -r Power-Gnome

dbus-send --type=method_call --print-reply --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'global.reexec_self()'
sleep 5s && dbus-send --type=method_call --print-reply --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'global.reexec_self()'
clear
gnome-session-quit
echo Done !!
