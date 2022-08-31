const Express = require("express");
const app = Express();
const cors = require("cors");
const sites = require("./sites.json");
const Feed = require("rss-parser");
const parser = new Feed();
const getMetaData = require("metadata-scraper");
const e = require("cors");
require("express-async-errors");
require("dotenv").config();
app.use(cors()); // for we can see the server whatever.
var list = []; // local variable

// function to add new post to array = list
function addNewPost(data, posts_list) {
  posts_list.push({
    title: data.title,
    link: data.link,
    isoDate: data.isoDate,
    name: data.name,
    image: data.image,
  });
}

// function to get data from sites
async function getData() {
  const temporary_list = [];
  for (const site of sites) {
    try {
      const data = await parser.parseURL(site.url);
      await data.items.forEach((item) => {
        getMetaData(item.link, {
          headers: {
            Connection: "keep-alive",
            "Accept-Encoding": "",
            "Accept-Language": "en-US,en;q=0.8",
          },
        })
          .then((response) => {
            // to get image from meta codes.
            item["image"] =
              response.image != undefined
                ? response.image
                : process.env.NOTFOUNIMAGE;
            item["name"] = site.name;
            addNewPost(item, temporary_list);
          })
          .catch((error) => {
            console.log(error);
          });
      });
    } catch (error) {}
  }
  list = temporary_list;
}

app.get("/", async (req, res) => {
  // to sort posts by date
  list.sort(function (a, b) {
    return new Date(b.isoDate) - new Date(a.isoDate);
  });
  // to filter by 20 only
  list.slice(0, 20);
  // response with list of posts
  res.send(list);
});

// function to run server after every 2 min
(async () => {
  await getData();
  setInterval(async () => {
    await getData();
  }, 60000 * 4);
})();

app.listen(process.env.PORT || 3000, () => console.log("listening..."));
