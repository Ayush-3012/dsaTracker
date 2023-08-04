import express from "express";
import bodyParser from "body-parser";
import questions from "./questions.js";
import _ from "lodash";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.render("index.ejs");
});

app.get("/about", async (req, res) => {
  res.render("about.ejs");
});

app.get("/:topic", async (req, res) => {
  const requestedDs = _.lowerCase(req.params.topic);
  questions.forEach(function (item) {
    if (_.lowerCase(item.topicName) == requestedDs)
      res.render("sheet.ejs", {
        dataStructure: item,
      });
  });
});

// app.post("/submit", (req, res) => {
//   res.render("index.ejs");
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
