const pool = require('../config/db');

// 1) Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM job_categories');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2) Get category ID by name
exports.getCategoryIdByName = async (req, res) => {
  const { name } = req.body;

  try {
    const result = await pool.query('SELECT id FROM job_categories WHERE name = $1', [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error fetching category ID by name:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3) Get category name by ID
exports.getCategoryNameById = async (req, res) => {
  const { id } = req.body;

  try {
    const result = await pool.query('SELECT name FROM job_categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ name: result.rows[0].name });
  } catch (err) {
    console.error('Error fetching category name by ID:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
