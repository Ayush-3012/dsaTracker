import express from "express";
import bodyParser from "body-parser";
import questions from "./questions.js";
import _ from "lodash";
import mongoose from "mongoose";
import { __dirname } from "path";

const app = express();
const port = 3000;

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "public"));
app.use(bodyParser.urlencoded({ extended: true }));

async function run() {
  await mongoose.connect(
    "mongodb+srv://Ayush-3012:Champ%403012@cluster0.veabqcp.mongodb.net/dsaTrackerDB"
  ),
    {
      socketTimeoutMS: 30000,
    };
}

run();

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

async function updateCheckbox(topic, name) {
  for (var i = 0; i < dsaTables.length; i++) {
    if (_.lowerCase(questions[i].topicName) == topic) {
      for (var j = 0; j < questions[i].questions.length; j++) {
        if (questions[i].questions[j].Problem == name) {
          questions[i].questions[j].Done = "checked";
        }
      }
    }
  }
}

async function resetCheckbox(topic, name) {
  for (var i = 0; i < dsaTables.length; i++) {
    if (_.lowerCase(questions[i].topicName) == topic) {
      for (var j = 0; j < questions[i].questions.length; j++) {
        if (questions[i].questions[j].Problem == name) {
          questions[i].questions[j].Done = false;
        }
      }
    }
  }
}

async function updateDoneQues() {
  for (var i = 0; i < dsaTables.length; i++) {
    const currentTable = dsaTables[i];
    try {
      const foundInDb = await currentTable.find();
      if (foundInDb.length != 0) {
        for (let j = 0; j < foundInDb.length; j++) {
          updateCheckbox(currentTable.modelName, foundInDb[j].name);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

let darkTheme = false;
app.post("/toggle-theme", (req, res) => {
  darkTheme = !darkTheme;
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  updateCount();
  updateDoneQues();
  const currentRoute = req.url;
  res.render("index.ejs", {
    data: questions,
    _: _,
    currentRoute,
    darkTheme,
  });
});

app.get("/about", async (req, res) => {
  const currentRoute = req.url;
  res.render("about.ejs", { currentRoute, darkTheme });
});

app.get("/:topic", async (req, res) => {
  updateDoneQues();
  const requestedDs = _.lowerCase(req.params.topic);
  const currentRoute = "/";
  questions.forEach(function (item) {
    if (_.lowerCase(item.topicName) == requestedDs)
      res.render("sheet.ejs", {
        dataStructure: item,
        currentRoute,
        darkTheme,
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
          } else {
            currentTable
              .deleteOne({ name: selectedQuesObj.name })
              .then(function () {
                resetCheckbox(
                  _.lowerCase(selectedQuesObj.topic),
                  selectedQuesObj.name
                );
              });
          }
        });
    }
    updateCount();
    updateDoneQues();
  }
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
