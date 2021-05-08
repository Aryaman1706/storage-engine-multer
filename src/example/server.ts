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

// * Without Validator -->
const gcStorageWithoutValidator = GcsEngine({
  bucket,
});

const uploadWithoutValidator = multer({
  storage: gcStorageWithoutValidator,
}).single("file");

app.post(
  "/upload-without-validator",
  uploadWithoutValidator,
  (_req: Request, res: Response) => {
    res.send("Hopefully file is uploaded");
  }
);
// * -->

// * With Validator -->
const validator = (req: Request) => {
  if (!req.body.email || !req.body.password) {
    return "Email or password missing";
  }

  return null;
};

const gcStorageWithValidator = GcsEngine({
  bucket,
  validator: validator,
});

const uploadWithValidator = multer({
  storage: gcStorageWithValidator,
}).single("file");

app.post(
  "/upload-with-validator",
  uploadWithValidator,
  (_req: Request, res: Response) => {
    res.send("Hopefully file is uploaded");
  }
);
// * -->

app.listen(5000, () => console.log("Server started on port 5000"));
