import express, { Request, Response } from "express";
import multer from "multer";
import GcsEngine from "../config/GcsEngine";
import { Storage } from "@google-cloud/storage";
import path from "path";

const app = express();
app.use(express.json());

const storage = new Storage({
  projectId: "project_id_gcp",
  keyFilename: path.resolve(__dirname, "./", "service-account.json"),
});

const bucket = storage.bucket("av-mailer-396d7.appspot.com");

const gcStorage = GcsEngine({
  bucket,
});

const upload = multer({
  storage: gcStorage,
});

app.post("/upload", upload.single("file"), (_req: Request, res: Response) => {
  res.send("Hopefully file is uploaded");
});

app.listen(5000, () => console.log("Server started on port 5000"));
