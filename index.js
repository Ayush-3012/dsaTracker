import express from "express";
import bodyParser from "body-parser";
import questions from "./questions.js";
import _ from "lodash";
import mongoose from "mongoose";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect("mongodb://127.0.0.1:27017/dsaTrackerDB");

const compQueSchema = {
  name: String,
  link1: String,
  link2: String,
};

const dsaTables = [];
questions.forEach(function (item) {
  dsaTables.push(
    mongoose.model(`${_.camelCase(_.lowerCase(item.topicName))}`, compQueSchema)
  );
});

app.get("/", (req, res) => {
  res.render("index.ejs", {
    data: questions,
    _: _,
  });
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

app.post("/updatedSheet", (req, res) => {
  const selectedQuesObj = JSON.parse(req.body.checkedQues);
  for (var i = 0; i < dsaTables.length; i++) {
    if (
      `${dsaTables[i].modelName}` ===
      _.camelCase(_.lowerCase(selectedQuesObj.topic))
    ) {
      const tableEntry = new dsaTables[i]({
        name: selectedQuesObj.name,
        link1: selectedQuesObj.link1,
        link2: selectedQuesObj.link2,
      });
      tableEntry.save();
    }
  }
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
