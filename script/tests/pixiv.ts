import Pixiv from "pixiv.ts"

async function useAPI() {
    /*Logging in is an asynchronous function. Don't try to use the constructor, all the properties will be undefined!*/
    const pixiv = await Pixiv.login(process.env.PIXIV_USERNAME, process.env.PIXIV_PASSWORD)

    /*If you wish, you can regenerate and return your refresh token manually if it has expired*/
    const refreshToken = await pixiv.refreshToken()

    /*You can get an illust very easily with it's url or id. Most endpoints will have a get() method
    that will parse the id out of the url automatically.*/
    const illust = await pixiv.illust.get("https://www.pixiv.net/en/artworks/76833012")

    /*You could also get the most bookmarked illust from the query. This uses search internally, so you can
    specify the parameters in the second argument.*/
    const shortcut = await pixiv.illust.get("gabriel", {r18: true})

    /*To parse the id out of any url, you can use util.parseID()*/
    const id = await pixiv.util.parseID("https://www.pixiv.net/en/artworks/75788934") //75788934

    /*You can search illusts with a query. The nextURL is stored in pixiv.search.nextURL.*/
    let illusts = await pixiv.search.illusts({word: "gabriel dropout"})
    /*There is also an utility to sort by most bookmarked.*/
    illusts = pixiv.util.sort(illusts)

    /*Filter parameters: en to search for english tags, type to filter by type, r18 to filter r18 illusts,
    and bookmarks to filter by minimum bookmarks. By default tags are translated to japanese, but you can change
    that behavior by changing en to true.*/
    const filteredSearch = await pixiv.search.illusts({word: "megumin", r18: true, type: "illust", bookmarks: "100"})
    const englishSearch = await pixiv.search.illusts({word: "cute", en: true})

    /*You can also search through the rankings, popular previews, etc.*/
    const rankings = await pixiv.illust.ranking({mode: "day_r18"})
    const popularPreviews = await pixiv.illust.popularPreview({word: "sagiri izumi"})

    /*And get all the illusts from a user.*/
    const userIllusts = await pixiv.user.illusts({user_id: 18590546})

    /*Getting novels is practically identical to illusts. The alternative to the get() method is
    to query the api for the details directly.*/
    const novel = await pixiv.novel.detail({novel_id: 11826198}).then((n) => n.novel)

    /*Novels obviously have text, and you can retrieve it with the text() method.*/
    const text = await pixiv.novel.text({novel_id: 11826198}).then((n) => n.novel_text)

    /*There is also manga, which 90% of the time will have multiple pages. You can get the
    urls of all the pages with the getPages() method.*/
    const manga = await pixiv.manga.get("https://www.pixiv.net/en/artworks/77333204")
    const pages = await pixiv.manga.getPages(manga)
}
useAPI()
