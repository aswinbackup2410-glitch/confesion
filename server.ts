import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/confessions", async (req, res) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase credentials not configured in AI Studio Secrets." });
    }
    try {
      const { data, error } = await supabase
        .from("confess")
        .select("confes, likes")
        .limit(50);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Supabase GET error:", error);
      res.status(500).json({ 
        error: "Failed to fetch confessions", 
        details: error.message || "Check if table 'confess' exists.",
        code: error.code
      });
    }
  });

  app.post("/api/confessions", async (req, res) => {
    const { content } = req.body;
    if (!content || content.length < 2) {
      return res.status(400).json({ error: "Confession is too short" });
    }

    try {
      const { data, error } = await supabase
        .from("confess")
        .insert([{ confes: content, likes: 0 }])
        .select();

      if (error) {
        console.error("Insert error:", error.message);
        return res.json({ confes: content, likes: 0 });
      }
      res.json(data[0]);
    } catch (error: any) {
      console.error("Supabase POST error:", error);
      res.status(500).json({ 
        error: "Failed to save confession", 
        details: error.message,
        code: error.code
      });
    }
  });

  app.post("/api/confessions/like", async (req, res) => {
    const { content } = req.body;
    try {
      const { data: current, error: fetchError } = await supabase
        .from("confess")
        .select("likes")
        .eq("confes", content)
        .maybeSingle();
      
      if (fetchError) throw fetchError;

      const newLikes = (current?.likes || 0) + 1;
      const { data, error } = await supabase
        .from("confess")
        .update({ likes: newLikes })
        .eq("confes", content)
        .select();

      if (error) throw error;
      res.json(data ? data[0] : { likes: newLikes });
    } catch (error: any) {
      console.error("Supabase LIKE error:", error);
      res.status(500).json({ 
        error: "Failed to like confession", 
        details: error.message,
        code: error.code
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
