class FrogServersUI {
    // Load list of servers
    static loadList = async () => {
        // Hardcoded servers list
        const servers = {
            servers: [
                {
                    name: "Axiom",
                    description: "Axiom Minecraft Server",
                    version: "1.19.4-1.21.4",
                    ip: "play.axiom-mc.org",
                    port: "25565",
                    icon: "assets/servers/axiom.png",
                    flVersion: "vanilla-1.20.4"
                },
                // Add more servers here following the same structure
            ]
        };

        // Clear the list
        $("#modal-servers .serversList .item:not(.placeholder)").remove();

        // Get placeholder code
        let placeholder = $("#modal-servers .serversList .item.placeholder")[0].outerHTML;
        placeholder = placeholder.replace(' placeholder', "");

        // Add new elements using placeholder
        servers.servers.forEach((srv) => {
            let preparedPlaceholder = placeholder.replaceAll(/\$1/gim, srv.name)
                .replaceAll(/\$2/gim, srv.description)
                .replaceAll(/\$3/gim, srv.version)
                .replaceAll(/\$4/gim, srv.ip)
                .replaceAll(/\$5/gim, srv.icon)
                .replaceAll(/\$6/gim, srv.ip + ":" + srv.port)
                .replaceAll(/\$7/gim, srv.flVersion);
            $("#modal-servers .serversList").append(preparedPlaceholder);
        })

        // Show all in list
        $("#modal-servers .serversList .item").each(function () {
            if (!$(this).hasClass("placeholder")) {
                $(this).show();
            }
        })
        FrogServersUI.refreshServersInfo();
        return true;
    }
    // Скопировать IP сервера
    static copyServerIP(ip) {
        navigator.clipboard.writeText(ip);
        FrogToasts.create(MESSAGES.servers.ipCopied, "share");
    }

    // Получить статус и информацию о сервере
    static queryServer = async (ip) => {
        let port = 25565;
        if(ip.split(":").length === 2){
            port = ip.split(":")[1];
            ip = ip.split(":")[0];
        }
        try {
            let query = await GameDig.query({type: "minecraft", host: ip, port: port});
            return {
                online: true,
                data: query
            }
        } catch(e) {
            return {
                online: false
            };
        }
    }

    // Обновить информацию о серверах в списке
    static refreshServersInfo = () => {
        $("#modal-servers .serversList .item:not(.placeholder)").each(async function () {
            let $status = $(this).find("div.status");
            let $onlineChip = $(this).find("div.cap-div div.chip");
            let ip = $(this).data("ip");

            $status.removeClass("online offline");
            $onlineChip.text("...");

            let serverQuery = await FrogServersUI.queryServer(ip);
            if(!serverQuery.online){
                $status.addClass("offline");
                $onlineChip.hide();
            } else {
                $status.addClass("online");
                $onlineChip.show();
                $onlineChip.text(`${serverQuery.data.numplayers} / ${serverQuery.data.maxplayers}`);
            }
        })
    }

    // Играть на сервере
    static playOnServer = async (ip, versionId) => {
        selectedServerFromList = ip;
        FrogVersionsManager.setActiveVersion(versionId);
        FrogFlyout.startSelectedVersion();
        return true;
    }
}