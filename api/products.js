import express from "express";
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json({
      status: 200,
      message: "Got the data successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

export default router;
