const Express = require('express');
const app = Express();
const cors = require('cors');
const sites = require('./sites.json');
const Feed = require('rss-parser');
const parser = new Feed();
const getMetaData = require('metadata-scraper');
require('dotenv').config();
app.use(cors());// for we can see the server whatever.
var list = []; // local variable 

// function to add new post to array = list 
function addNewPost(data){
    list.push({
        title: data.title, 
        link: data.link,
        isoDate: data.isoDate,
        name: data.name,
        image: data.image
    });
}

// function to get data from sites
async function getData(){
    for (const site of sites) {
        try {
            const data = await parser.parseURL(site.url);
            await data.items.forEach(item => {
                getMetaData(item.link).then((response)=> { // to get image from meta codes.
                    item["image"] = (response.image != undefined)? response.image : process.env.NOTFOUNIMAGE;
                    item["name"] = site.name;
                    addNewPost(item);
                });
            });
        } catch (error) {
            console.log(error);
        }
    }
}


// function to organazition posts in list with date.
function organazition(listOfPosts){
    return listOfPosts.sort((firstPost, secondPost)=> {
        return new Date(secondPost.isoDate) - new Date(firstPost.isoDate);
    })
}


app.get("/", async (req, res)=> {
    await getData();
    await organazition(list);
    await res.send(list);
});

app.listen(process.env.PORT || 3000, ()=> console.log("listening..."));