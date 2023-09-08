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
  checked: Boolean,
};

const dsaTables = [];
questions.forEach(function (item) {
  dsaTables.push(
    mongoose.model(`${_.camelCase(_.lowerCase(item.topicName))}`, compQueSchema)
  );
});

async function updateCount() {
  for (var i = 0; i < dsaTables.length; i++) {
    if (
      `${dsaTables[i].modelName}` ===
      _.camelCase(_.lowerCase(questions[i].topicName))
    ) {
      questions[i].doneQuestions = await dsaTables[i]
        .count()
        .then((cnt) => cnt);
    }
  }
}

async function updateDoneQues(topic, name) {
  for (var i = 0; i < dsaTables.length; i++) {
    if (_.lowerCase(questions[i].topicName) == topic) {
      for (var j = 0; j < questions[i].questions.length; j++) {
        if (questions[i].questions[j].Problem == name) {
          if (questions[i].questions[j].Done == "checked")
            questions[i].questions[j].Done = false;
          else questions[i].questions[j].Done = "checked";
        }
      }
    }
  }
}

app.get("/", (req, res) => {
  updateCount();
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
  updateCount();
  let selectedQuesObj;
  if (req.body.checkedQues) selectedQuesObj = JSON.parse(req.body.checkedQues);
  else selectedQuesObj = JSON.parse(req.body.uncheckedQues);
  for (var i = 0; i < dsaTables.length; i++) {
    const currentTable = dsaTables[i];
    if (
      `${currentTable.modelName}` ===
      _.camelCase(_.lowerCase(selectedQuesObj.topic))
    ) {
      const tableEntry = new currentTable({
        name: selectedQuesObj.name,
        link1: selectedQuesObj.link1,
        link2: selectedQuesObj.link2,
      });
      currentTable
        .findOne({ name: selectedQuesObj.name })
        .then(function (foundQuestion) {
          if (!foundQuestion) {
            tableEntry.save();
            updateDoneQues(
              _.lowerCase(selectedQuesObj.topic),
              selectedQuesObj.name
            );
          } else {
            currentTable
              .deleteOne({ name: selectedQuesObj.name })
              .then(function () {});
            updateDoneQues(
              _.lowerCase(selectedQuesObj.topic),
              selectedQuesObj.name
            );
          }
        });
    }
    updateCount();
  }
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
