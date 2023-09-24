import express from "express";
import bodyParser from "body-parser";
import questions from "./questions.js";
import _ from "lodash";
import mongoose from "mongoose";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
async function run() {
  await mongoose.connect(
    // "mongodb+srv://Ayush-3012:Champ%403012@cluster0.veabqcp.mongodb.net/dsaTrackerDB"
    "mongodb://127.0.0.1:27017/dsaTrackerDB"
  ),
    {
      socketTimeoutMS: 1000,
    };
}

run();

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

async function updateCount(currentTable) {
  for (var i = 0; i < dsaTables.length; i++) {
    if (currentTable.modelName == _.lowerCase(questions[i].topicName)) {
      questions[i].doneQuestions = await currentTable
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
    if (questions[i].topicName == topic) {
      for (var j = 0; j < questions[i].questions.length; j++) {
        if (questions[i].questions[j].Problem == name) {
          questions[i].questions[j].Done = false;
        }
      }
    }
  }
}

async function updateDoneQues(currentTable) {
  await currentTable.find().then(function (foundInDb) {
    foundInDb.forEach(function (item) {
      updateCheckbox(currentTable.modelName, item.name);
    });
  });
}

let darkTheme = false;
app.post("/toggle-theme", (req, res) => {
  darkTheme = !darkTheme;
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  for (var i = 0; i < dsaTables.length; i++) {
    updateDoneQues(dsaTables[i]);
    updateCount(dsaTables[i]);
  }
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
  let selectedQuesObj;
  if (req.body.checkedQues) selectedQuesObj = JSON.parse(req.body.checkedQues);
  else selectedQuesObj = JSON.parse(req.body.uncheckedQues);

  for (var i = 0; i < dsaTables.length; i++) {
    const currentTable = dsaTables[i];
    if (
      `${currentTable.modelName}` ===
      _.camelCase(_.lowerCase(selectedQuesObj.item.Topic))
    ) {
      currentTable
        .findOne({ name: selectedQuesObj.item.Problem })
        .then(function (foundQuestion) {
          if (!foundQuestion) {
            const tableEntry = new currentTable({
              name: selectedQuesObj.item.Problem,
              link1: selectedQuesObj.item.URL,
              link2: selectedQuesObj.item.URL2,
            });
            tableEntry.save().then(function () {
              updateDoneQues(currentTable);
            });
          } else {
            currentTable
              .deleteOne({ name: selectedQuesObj.item.Problem })
              .then(function () {
                resetCheckbox(
                  selectedQuesObj.item.Topic,
                  selectedQuesObj.item.Problem
                );
              });
          }
        });
    }
    updateDoneQues(currentTable);
  }
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
