import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Create comment (protected)
export const createComment = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { productId } = req.params as { productId: string };
    if (!UUID_REGEX.test(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    const { content } = req.body ?? {};
    if (typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "Comment content is required" });
    }
    // verify product exists
    const product = await queries.getProductById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const comment = await queries.createComment({
      content: content.trim(),
      userId,
      productId,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// Delete comment (protected - owner only)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { commentId } = req.params as { commentId: string };
    if (!UUID_REGEX.test(commentId)) {
      return res.status(400).json({ error: "Invalid commentId" });
    }

    // check if comment exists and belongs to user
    const existingComment = await queries.getCommentById(commentId);
    if (!existingComment)
      return res.status(404).json({ error: "Comment not found" });

    if (existingComment.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    await queries.deleteComment(commentId);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
