let isAppInDev = process.env.LAUNCHER_IN_DEV !== undefined;
let isAppInTest = process.env.LAUNCHER_IN_TEST !== undefined;

if (isAppInDev && !process.argv.includes("noreload")) {
    require('electron-reloader')(module);
}

// Загрузка модулей
let startTime = performance.now();
const {app, ipcMain, BrowserWindow, globalShortcut, dialog} = require("electron");
const {autoUpdater} = require("electron-updater");
const os = require("os");
const colors = require("colors");
const {Auth} = require("msmc");
const pjson = require("./package.json");
require('console-stamp')(console);
const userDataPath = app.getPath("userData");

const {forge, neoforge, fabric, quilt, vanilla, liner} = require("tomate-loaders");

let lastLogBack;

// Создаём глобальные переменные для хранения BrowserWindow
let mainWindowObject;
let mainWindow = require("./windows/mainWindow"); // Модуль для создания главного окна
const DEFAULT_USER_AGENT = "FrogLauncher/v" + pjson.version;

// Е-Е-Едем
console.log(colors.inverse("OceanLauncher v" + pjson.version + " | Hostname: " + os.hostname() + " | <> by AxiomLab"));

app.whenReady().then(() => {
    if (!isAppInDev) {
        console.log(colors.inverse("We are in production mode"));

        // Отключение клавиш для перезагрузки страницы
        app.on('browser-window-focus', function () {
            globalShortcut.register('Control+Shift+I', () => {
                return false;
            });
            globalShortcut.register("CommandOrControl+R", () => {
                return false;
            });
            globalShortcut.register("F5", () => {
                return false;
            });
        });

        app.on('browser-window-blur', function () {
            globalShortcut.unregister('CommandOrControl+R');
            globalShortcut.unregister('F5');
            globalShortcut.unregister('Control+Shift+I');
        });
    } else {
        console.log(colors.inverse("ooo|   Hello, developer   |ooo"));

        // Сброс времени запуска при перезагрузке страницы
        app.on('browser-window-focus', function () {
            globalShortcut.register("CommandOrControl+R", () => {
                startTime = performance.now();
                mainWindowObject.webContents.reloadIgnoringCache();
                return true;
            });
        });

        app.on('browser-window-blur', function () {
            globalShortcut.unregister('CommandOrControl+R');
        });
    }

    // Создаём главное окно
    mainWindow.create(function (winObj) {
        mainWindowObject = winObj;
        mainWindowObject.webContents.userAgent = DEFAULT_USER_AGENT;

        // Фикс для Alt+F4
        mainWindowObject.on("closed", () => {
            console.log(colors.blue("Bye Bye"));
            app.exit(0);
        })
    console.log(colors.green("Main window created"));
});

    // Получить userdataPath
    ipcMain.on("get-userdata-path", (e) => {
        e.returnValue = userDataPath;
    });

    // Получить isInDev
    ipcMain.on("isAppInDev", (e) => {
        e.returnValue = isAppInDev;
    });

    // Получить isInTest
    ipcMain.on("isAppInTest", (e) => {
        e.returnValue = isAppInTest;
    });

    // Запуск лаунчера завершён
    ipcMain.on("launcher-ready", (e) => {
        let endTime = performance.now();
        console.log("Launcher started in", colors.yellow(((endTime - startTime) / 1000).toFixed(3) + "s"));
    });

    // Закрыть окно лаунчера
    ipcMain.on("close-main-window", () => {
        console.log(colors.blue("Bye Bye"));
        mainWindowObject.close();
        mainWindowObject = null;
        app.exit(0);
    });

    // Свернуть окно лаунчера
    ipcMain.on("hide-main-window", () => {
        mainWindowObject.minimize();
    });

    // Перезагрузить окно лаунчера
    ipcMain.on("reload-main-window", () => {
        mainWindowObject.webContents.reload();
    });

    // Развернуть на весь экран окно лаунчера
    ipcMain.on("maximize-main-window", () => {
        if (mainWindowObject.isMaximized()) {
            mainWindowObject.unmaximize();
        } else {
            mainWindowObject.maximize();
        }
    });

    // Полностью скрыть окно лаунчера
    ipcMain.on("disappear-main-window", () => {
        mainWindowObject.hide();
    });

    // Показать окно лаунчера
    ipcMain.on("appear-main-window", () => {
        mainWindowObject.show();
        mainWindowObject.focus();
    });

    // Фикс для сраного Электрона?
    ipcMain.on("focus-fix", () => {
        mainWindowObject.blur();
        mainWindowObject.focus();
    });

    // Диалог открытия файлов
    ipcMain.handle("open-dialog", async (event, options) => {
        let result = await dialog.showOpenDialog(options);
        if (result.canceled === true) {
            return false;
        }
        return result.filePaths || result.filePath;
    });

    // Диалог сохранения файлов
    ipcMain.handle("save-dialog", async (event, options) => {
        let result = await dialog.showSaveDialog(options);
        if (result.canceled === true) {
            return false;
        }
        return result.filePath;
    });

    // Авторизация через Microsoft
    ipcMain.on("use-ms-auth", (event) => {
        let authManager = new Auth("select_account");
        authManager.launch("electron").then((xboxManager) => {
            xboxManager.getMinecraft().then((result2) => {
                event.sender.send("get-ms-auth-result", {
                    profile: result2.profile,
                    mclc: result2.mclc()
                });
            })
        });
    });

    // Получить конфиг для MCLC
    ipcMain.on("generate-mclc-config", (event, data) => {
        let type = data.type;
        let version = data.version;
        let gameData = data.gameData;

        switch (type) {
            case "vanilla":
                return event.sender.send("get-mclc-config", {
                    version: {
                        type: "release",
                        number: version,
                    },
                    root: gameData
                });
            case "forge":
                return forge.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "forgeOptiFine":
                return forge.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "neoforge":
                return neoforge.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "fabric":
                return fabric.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
            case "quilt":
                return quilt.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath: gameData
                }).then((result) => {
                    event.sender.send("get-mclc-config", result);
                });
        }
    })

const DiscordRPC = require('discord-rpc');
const clientId = '1322942190615527474'; // You'll need to create a Discord application and get its ID
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

rpc.on('ready', () => {
    rpc.setActivity({
        details: 'Playing Minecraft',
        state: 'In OceanLauncher',
        largeImageKey: 'ocean_launcher_logo', // Upload this asset in Discord Developer Portal
        largeImageText: 'OceanLauncher',
        startTimestamp: new Date(),
    });
});

rpc.login({ clientId }).catch(console.error);})

