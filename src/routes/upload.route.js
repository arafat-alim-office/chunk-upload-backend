import { Router } from "express";
import multer from "multer";
import { UploadController } from "../controllers/upload.controller.js";

const router = Router();
const upload = multer({ dest: "tmp/multer" }); // temporary storage

router.post("/init", UploadController.init);
router.post(
  "/:sessionId/chunk",
  upload.single("chunk"),
  UploadController.receiveChunk
);
router.post("/:sessionId/complete", UploadController.complete);
router.post("/:sessionId/cancel", UploadController.cancel);

export default router;
