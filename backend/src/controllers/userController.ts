import type { Request, Response } from "express";
import * as queries from "../db/queries";

import { getAuth } from "@clerk/express";

export async function syncUser(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { email, name, imageUrl } = req.body ?? {};
    if (typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({ error: "Email is required" });
    }
    const normalizedName =
      typeof name === "string" && name.trim() !== "" ? name.trim() : null;
    const normalizedImageUrl =
      typeof imageUrl === "string" && imageUrl.trim() !== ""
        ? imageUrl.trim()
        : null;
    const user = await queries.upsertUser({
      id: userId,
      email: email.trim().toLowerCase(),
      name: normalizedName,
      imageUrl: normalizedImageUrl,
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
}
