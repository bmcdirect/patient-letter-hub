// routes.ts — PatientLetterHub Starter API
import { Express, Request, Response } from "express";
import { db } from "./db";
import bcrypt from "bcryptjs";

export function registerRoutes(app: Express) {
  console.log("✅ Registering PatientLetterHub API");

  // -------------------------------
  // ✅ AUTH: Register + Login
  // -------------------------------
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing fields" });

    const userExists = await db.execute(`SELECT id FROM users WHERE email = $1`, [email]);
    if (userExists.rows.length) return res.status(409).json({ success: false, message: "User exists" });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.execute(
      `INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email`,
      [email, hash, first_name || "", last_name || ""]
    );
    req.session.user = { id: result.rows[0].id, email };
    return res.json({ success: true, user: { id: result.rows[0].id, email } });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await db.execute(`SELECT * FROM users WHERE email = $1`, [email]);
    if (!result.rows.length) return res.status(401).json({ success: false, message: "Invalid login" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid login" });

    req.session.user = { id: user.id, email };
    return res.json({ success: true, user: { id: user.id, email } });
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    // Check both passport (req.user) and session-based auth
    if (req.user) {
      return res.json({ success: true, user: req.user });
    }
    if (req.session?.user) {
      return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ success: false, message: "Not logged in" });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // -------------------------------
  // ✅ PRACTICE CRUD
  // -------------------------------
  app.get("/api/practices", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const result = await db.execute(`SELECT * FROM practices WHERE owner_id = $1`, [userId]);
    res.json({ success: true, practices: result.rows });
  });

  app.post("/api/practices", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const {
      name, phone, email, main_address, city, state, zip_code,
      taxonomy_code, npi_number, operating_hours, emr_id
    } = req.body;

    await db.execute(
      `INSERT INTO practices (owner_id, name, phone, email, main_address, city, state, zip_code, taxonomy_code, npi_number, operating_hours, emr_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [userId, name, phone, email, main_address, city, state, zip_code, taxonomy_code, npi_number, operating_hours, emr_id]
    );

    res.json({ success: true });
  });

  // -------------------------------
  // ✅ LOCATIONS CRUD
  // -------------------------------
  app.get("/api/locations", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const result = await db.execute(
      `SELECT pl.* FROM practice_locations pl
       JOIN practices p ON pl.practice_id = p.id WHERE p.owner_id = $1`,
      [userId]
    );
    res.json({ success: true, locations: result.rows });
  });

  app.post("/api/locations", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const { practice_id, label, contact_name, phone, email, address_line1, city, state, zip_code, is_default } = req.body;

    await db.execute(
      `INSERT INTO practice_locations
      (practice_id, label, contact_name, phone, email, address_line1, city, state, zip_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [practice_id, label, contact_name, phone, email, address_line1, city, state, zip_code, is_default || false]
    );

    res.json({ success: true });
  });

  // -------------------------------
  // ✅ QUOTES CRUD
  // -------------------------------
  app.post("/api/quotes", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const {
      practice_id, location_id, subject, template_type, color_mode,
      estimated_recipients, enclosures, data_cleansing, ncoa_update,
      first_class_postage, notes
    } = req.body;

    const base = color_mode === "color" ? 0.65 : 0.50;
    let total = estimated_recipients * base;
    if (data_cleansing) total += 25;
    if (ncoa_update) total += 50;
    if (first_class_postage) total += estimated_recipients * 0.68;

    const quoteCount = await db.execute("SELECT COUNT(*) FROM quotes");
    const quoteNumber = `Q-${parseInt(quoteCount.rows[0].count) + 1001}`;

    await db.execute(
      `INSERT INTO quotes (quote_number, user_id, practice_id, location_id, subject, template_type, color_mode, estimated_recipients, enclosures, data_cleansing, ncoa_update, first_class_postage, notes, total_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [quoteNumber, userId, practice_id, location_id, subject, template_type, color_mode, estimated_recipients, enclosures, data_cleansing, ncoa_update, first_class_postage, notes, total]
    );

    res.json({ success: true, quoteNumber });
  });

  app.get("/api/quotes", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const result = await db.execute(
      `SELECT q.*, p.name as practice_name FROM quotes q
       LEFT JOIN practices p ON q.practice_id = p.id WHERE q.user_id = $1 ORDER BY q.created_at DESC`,
      [userId]
    );

    res.json({ success: true, quotes: result.rows });
  });

  // -------------------------------
  // ✅ ORDER CRUD
  // -------------------------------
  app.post("/api/quotes/:id/convert", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const { id } = req.params;
    const quote = await db.execute(`SELECT * FROM quotes WHERE quote_number = $1 AND user_id = $2`, [id, userId]);
    if (!quote.rows.length) return res.status(404).json({ success: false, message: "Quote not found" });

    const orderCount = await db.execute("SELECT COUNT(*) FROM orders");
    const orderNumber = `O-${parseInt(orderCount.rows[0].count) + 1001}`;

    await db.execute(
      `INSERT INTO orders (order_number, user_id, practice_id, quote_id, location_id, subject, template_type, color_mode, recipient_count, enclosures, data_cleansing, ncoa_update, first_class_postage, notes, total_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [orderNumber, userId, quote.rows[0].practice_id, quote.rows[0].id, quote.rows[0].location_id, quote.rows[0].subject, quote.rows[0].template_type, quote.rows[0].color_mode, quote.rows[0].estimated_recipients, quote.rows[0].enclosures, quote.rows[0].data_cleansing, quote.rows[0].ncoa_update, quote.rows[0].first_class_postage, quote.rows[0].notes, quote.rows[0].total_cost]
    );

    await db.execute(`UPDATE quotes SET status = 'Converted' WHERE id = $1`, [quote.rows[0].id]);
    res.json({ success: true, orderNumber });
  });

  app.get("/api/orders", async (req: Request, res: Response) => {
    const { id: userId } = req.session.user || {};
    if (!userId) return res.status(401).json({ success: false });

    const result = await db.execute(
      `SELECT o.*, p.name as practice_name FROM orders o
       LEFT JOIN practices p ON o.practice_id = p.id WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ success: true, orders: result.rows });
  });

  console.log("✅ All routes registered.");
}
