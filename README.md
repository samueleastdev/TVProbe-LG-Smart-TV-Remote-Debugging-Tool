# TVProbe Smart TV Remote Debugging

# Starting the webcam

```bash
mediamtx /etc/mediamtx.yml
```

-   Person on the Mac connecting runs

```bash
curl -s https://install.zerotier.com | sudo bash
```

-   Then joins the network the network ID is in the dashboard.

```bash
sudo zerotier-cli join (id)
200 join OK
Get the correct IP to use on the Pi with this command
```

```bash
sudo zerotier-cli listnetworks
200 listnetworks <nwid> <name> <mac> <status> <type> <dev> <ZT assigned ips>
200 listnetworks (id) modest_felsenstein (mac) OK PRIVATE ztcfw6agkx (ip)/16
```

-   They will now be able to connect and should see the camera

```bash
http://(ip):8889/cam
```

-   Find ZeroTier running on the Pi

```bash
sudo zerotier-cli status
200 info (id) 1.14.2 ONLINE
```

FIX DEV TUNNELS

```
document.cookie = "tunnel_phishing_protection=id.euw; max-age=" + 365 * 24 * 60 * 60;
```
