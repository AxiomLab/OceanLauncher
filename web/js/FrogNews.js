class FrogNews {
    static getNews = async () => {
        // Local news data
        const localNews = [
            {
                title: "Welcome to OceanLauncher",
                description: "Your new Minecraft launcher experience begins here",
                date: "2024",
                url: "https://discord.gg/ZNNRWtHWuy"
            },
            {
                title: "Getting Started",
                description: "Select a version and start playing right away",
                date: "2024",
            },
            {
                title: "Need Help?",
                description: "Join our community for support and updates",
                date: "2024",
                url: "#"
            }
        ];
        return [true, localNews];
    }

    // Загрузить новости в UI
    static loadNewsToUI = async () => {
        $(".news .preloader").show();
        $(".news .news-list").hide();
        $(".news .news-list").html("");

        let [isSuccess, news] = await FrogNews.getNews();
        if(!isSuccess || !news){
            return false;
        }
        let placeholder = $(".news .placeholder")[0].outerHTML;
        placeholder = placeholder.replace(' placeholder"', "");
        // По placeholder`у добавляем новые элементы
        news.forEach((item) => {
            let preparedPlaceholder = placeholder.replaceAll("$1", item.title).replaceAll("$2", item.description).replaceAll("$3", item.date);
            if (typeof item.url !== "undefined") {
                preparedPlaceholder = preparedPlaceholder.replaceAll("$4", item.url).replace('class="link" style="display: none;"', 'class="link"');
            }
            let backgroundImageCSS = `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.82), rgb(0, 0, 0)), url("${item.picture}")`;
            $(".news .news-list").append(preparedPlaceholder);
            $(".news .news-list .news-item:last-child").css("background-image", backgroundImageCSS);
        })
        $(".news .preloader").hide();
        $(".news .news-list").show();
        animateCSSNode($(".news .news-list")[0], "fadeIn");
        return true;
    }
}