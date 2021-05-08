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

/**
 * Short Note on validator
 *
 * ? Why is validation important?
 * As multer is responsible for parsing req.body so by the time req.body would be available
 * to the next request handler after multer's middleware, files would have already been uploaded.
 * Lets say req.body is invalid and hence you no longer need those files so you would have to explicitly
 * delete the files. These files need not be uploaded. This is a vulnerability as a malicious user can
 * send multiple invalid requests and yet all the files provided by the user would be uploaded.
 * This becomes more concerning with cloud providers that charge for upload operations performed.
 *
 * ? Why is validator function included in multer storage engine?
 * Because multer is responsible for parsing request so any middleware before the middleware
 * of multer would have req.body = {}. Hence validation of req.body must be done inside
 * custom storage engine only.
 *
 * Validator function would recieve req and should return string in case of error and null otherwise.
 * For details and functioning of validator check config/GcsEngine.ts
 */

/**
 * ! VERY VERY IMPORTANT POINT REGARDING VALIDATOR FUNCTION
 * Make sure that fields on which files are attached are in the bottom of formdata.
 * All other fields that do not contain files must be placed above the ones containing file.
 *
 * For Example:-
 * Lets say field "file" contains a file while fields "email" and "password" contain text.
 *
 * Now if order in formdata is email, password, file then email and password feilds could be validated
 * and req.body inside validator would be { email: "test@mail.com", password: "test" }.
 *
 * But if order in formdata is email, file, password then only email could be validated
 * and req.body inside validator would be { email: "test@mail.com" }.
 * Similarly if order is file, email, password then req.body inside validator would be empty ({})
 *
 * Think of field containing file as a breakpoint in req.body hence only the fields before it
 * would be available in req.body.
 */

// For details regarding error handling check out https://github.com/expressjs/multer#error-handling

const validator = (req: Request) => {
  console.log(req.body);
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
