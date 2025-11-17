# TVProbe – Smart TV Remote Debugging

![TVProbe Logo](https://s3.us-east-1.amazonaws.com/s3b-delivery-bucket/screenshot_2025_11_01_at_12.41.08.png)

TVProbe allows developers to remotely debug and control Smart TVs (LG, Samsung, etc.) through a secure Zerotier network. It includes webcam integration via MediaMTX and remote control functionality for development and testing.

---

## Starting the Webcam

1. Open the `cam/mediamtx.yml` file and edit the last line to match your connected camera. https://mediamtx.org/docs/usage/publish
   Example FFmpeg command:

    ```bash
    ./ffmpeg -f avfoundation -framerate 30 -video_size 1280x720 -i "0:0" -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f rtsp rtsp://127.0.0.1:8554/cam
    ```

2. Start the webcam stream navigate to the cam folder and run :

    ```bash
    ./mediamtx
    ```

3. Create a `.env` file in your project root with the correct values.  
   (Ensure your LG TV is on the same network as the computer running this app.)

    ```bash
    LG_IP=192.000.0.000
    LG_APP_FILE=remote-dev_1.0.0_all.ipk
    LG_APP_ID=remote-dev
    LG_DEVICE_NAME=tvapp
    LG_DEV_APP_ID=com.palmdts.devmode
    ZEROTIER_IP=172.00.00.00
    ```

---

## Install WebOS Devtools CLI

```bash
npm install -g @webos-tools/cli
```

1. verify

```bash
ares --version
ares-package --help
```

## Setting Up Zerotier

![Zerotier Info](https://s3.us-east-1.amazonaws.com/s3b-delivery-bucket/zerotier.png)

1. Go to [zerotier.com](https://www.zerotier.com) and create a free account.  
   You can add up to 10 devices on the free plan.  
   Note down your **Network ID**, which you’ll share with others who need to connect.

2. On the Mac that will connect, install Zerotier:

    ```bash
    curl -s https://install.zerotier.com | sudo bash
    ```

3. Join your Zerotier network (replace `(id)` with your actual Network ID):

    ```bash
    sudo zerotier-cli join (id)
    ```

    Output should look like:

    ```
    200 join OK
    ```

4. Check your assigned IP address:

    ```bash
    sudo zerotier-cli listnetworks
    ```

    Example output:

    ```
    200 listnetworks <nwid> <name> <mac> <status> <type> <dev> <ZT assigned ips>
    200 listnetworks (id) modest_felsenstein (mac) OK PRIVATE (id) (ip)/16
    ```

5. Once the device has joined and you’ve **activated it** in the Zerotier dashboard, start the app:

    ```bash
    npm start
    ```

---

## Using TVProbe

-   After the app starts, it will display a URL like:  
    `http://172.00.00.00:3001`  
    Share this address with anyone on your Zerotier network.  
    They will be able to control and debug your TV remotely.

-   **Settings button** – start or configure the app
-   **Build URL** – paste in a web app URL to build and deploy to the TV
-   **Remote button** – open the virtual remote to control the TV

When you build, you’ll get a **developer inspector URL** similar to:

```
http://172.00.00.00:63838/devtools/inspector.html?ws=172.27.98.48:63838/devtools/page/25ac49b0-dca1-4eb5-935b-886f1af42974
```

If this URL doesn’t open correctly, you may be using an unsupported version of Chromium.  
Refer to the official LG WebOS debugging guide:  
[https://webostv.developer.lge.com/develop/getting-started/app-debugging](https://webostv.developer.lge.com/develop/getting-started/app-debugging)

---

## Contributing

Please report any issues, share improvements, and contribute via pull requests.  
Together we can make Smart TV remote development faster and easier.
