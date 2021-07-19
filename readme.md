## Cron
```
* * * * * /usr/bin/node /home/pi/seneye/index.js  >> /home/pi/my.log 2>&1
```
## USB Access
Add USB rules to /etc/udev/rules.d/
Add User:
```
sudo usermod -a -G plugdev pi
 ```
Unplug Seneye

Reset Rules:
```
sudo udevadm control --reload-rules
 ```