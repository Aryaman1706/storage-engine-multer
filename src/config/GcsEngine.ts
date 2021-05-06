import { Bucket, CreateWriteStreamOptions } from "@google-cloud/storage";
import { Request } from "express";
import multer from "multer";
import path from "path";

type nameFnType = (req: Request, file: Express.Multer.File) => string;

type Options = {
  bucket: Bucket;
  options?: CreateWriteStreamOptions;
  nameFn?: nameFnType;
};

const defaultNameFn: nameFnType = (
  _req: Request,
  file: Express.Multer.File
) => {
  const fileExt = path.extname(file.originalname);

  return `${file.fieldname}_${Date.now()}${fileExt}`;
};

interface CustomFileResult extends Partial<Express.Multer.File> {
  name: string;
}

class CustomStorageEngine implements multer.StorageEngine {
  private bucket: Bucket;
  private options: CreateWriteStreamOptions;
  private nameFn: nameFnType;

  constructor(opts: Options) {
    this.bucket = opts.bucket;
    this.options = opts.options || {};
    this.nameFn = opts.nameFn || defaultNameFn;
  }

  _handleFile = (
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: CustomFileResult) => void
  ): void => {
    if (!this.bucket) {
      cb(new Error("bucket is a required field."));
      return;
    }

    const fileName = this.nameFn(req, file);

    const storageFile = this.bucket.file(fileName);
    const fileWriteStream = storageFile.createWriteStream(this.options);
    const fileReadStream = file.stream;

    fileReadStream
      .pipe(fileWriteStream)
      .on("error", (err) => {
        fileWriteStream.end();
        storageFile.delete({ ignoreNotFound: true });
        cb(err);
      })
      .on("finish", () => {
        console.log("done");
        cb(null, { name: fileName });
      });
  };

  _removeFile = (
    _req: Request,
    file: Express.Multer.File & { name: string },
    cb: (error: Error | null) => void
  ): void => {
    this.bucket.file(file.name).delete({ ignoreNotFound: true });
    cb(null);
  };
}

export default (opts: Options) => {
  return new CustomStorageEngine(opts);
};
