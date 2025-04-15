const db = require('../config/db');

exports.createDigitalProduct = async (req, res) => {
  try {
    const { freelancerId, productName, description, productUrl, price } = req.body;
    
    // Validate required fields
    if (!freelancerId || !productName || !description || !productUrl || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists and is a freelancer
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [freelancerId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (userCheck.rows[0].user_type !== 'freelancer') {
      return res.status(400).json({ error: 'Only freelancers can create digital products' });
    }
    
    // Insert digital product
    const result = await db.query(
      'INSERT INTO digitalproducts (freelancer_id, product_name, description, product_url, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [freelancerId, productName, description, productUrl, price]
    );
    
    res.status(201).json({
      message: 'Digital product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating digital product:', error);
    res.status(500).json({ error: 'Server error while creating digital product' });
  }
};

exports.getDigitalProducts = async (req, res) => {
  try {
    // Get all products or filter by freelancer
    const userId = req.query.userId;
    
    let query = 'SELECT dp.*, u.email as freelancer_email, AVG(pr.rating) as average_rating FROM digitalproducts dp JOIN users u ON dp.freelancer_id = u.id LEFT JOIN product_reviews pr ON dp.id = pr.product_id';
    const params = [];
    
    if (userId) {
      query += ' WHERE dp.freelancer_id = $1';
      params.push(userId);
    }
    
    query += ' GROUP BY dp.id, u.email ORDER BY dp.created_at DESC';
    
    const result = await db.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching digital products:', error);
    res.status(500).json({ error: 'Server error while fetching digital products' });
  }
};

exports.getDigitalProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const productResult = await db.query(
      `SELECT dp.*, u.email as freelancer_email 
       FROM digitalproducts dp 
       JOIN users u ON dp.freelancer_id = u.id 
       WHERE dp.id = $1`,
      [productId]
    );
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Digital product not found' });
    }
    
    // Get reviews for this product
    const reviewsResult = await db.query(
      `SELECT pr.*, u.email as reviewer_email 
       FROM product_reviews pr 
       JOIN users u ON pr.reviewer_id = u.id 
       WHERE pr.product_id = $1 
       ORDER BY pr.created_at DESC`,
      [productId]
    );
    
    res.json({
      product: productResult.rows[0],
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error('Error fetching digital product:', error);
    res.status(500).json({ error: 'Server error while fetching digital product' });
  }
};

exports.updateDigitalProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { productName, description, productUrl, price } = req.body;
    
    // Check if product exists
    const productCheck = await db.query('SELECT * FROM digitalproducts WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Digital product not found' });
    }
    
    // Update product
    const result = await db.query(
      `UPDATE digitalproducts 
       SET product_name = COALESCE($1, product_name),
           description = COALESCE($2, description),
           product_url = COALESCE($3, product_url),
           price = COALESCE($4, price),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [productName, description, productUrl, price, productId]
    );
    
    res.json({
      message: 'Digital product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating digital product:', error);
    res.status(500).json({ error: 'Server error while updating digital product' });
  }
};

exports.deleteDigitalProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Check if product exists
    const productCheck = await db.query('SELECT * FROM digitalproducts WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Digital product not found' });
    }
    
    // Delete product
    await db.query('DELETE FROM digitalproducts WHERE id = $1', [productId]);
    
    res.json({
      message: 'Digital product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting digital product:', error);
    res.status(500).json({ error: 'Server error while deleting digital product' });
  }
};

exports.submitProductReview = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { reviewerId, rating, comment } = req.body;
    
    // Validate required fields
    if (!productId || !reviewerId || rating === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate rating (0-5)
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }
    
    // Check if product exists
    const productCheck = await db.query('SELECT * FROM digitalproducts WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Digital product not found' });
    }
    
    // Check if reviewer exists
    const reviewerCheck = await db.query('SELECT * FROM users WHERE id = $1', [reviewerId]);
    if (reviewerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reviewer not found' });
    }
    
    // Check if reviewer already submitted a review for this product
    const reviewCheck = await db.query(
      'SELECT * FROM product_reviews WHERE product_id = $1 AND reviewer_id = $2',
      [productId, reviewerId]
    );
    
    // If review exists, update it
    if (reviewCheck.rows.length > 0) {
      const result = await db.query(
        `UPDATE product_reviews 
         SET rating = $1, 
             comment = $2,
             created_at = NOW()
         WHERE product_id = $3 AND reviewer_id = $4
         RETURNING *`,
        [rating, comment, productId, reviewerId]
      );
      
      return res.json({
        message: 'Product review updated successfully',
        review: result.rows[0]
      });
    }
    
    // Insert new review
    const result = await db.query(
      'INSERT INTO product_reviews (product_id, reviewer_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [productId, reviewerId, rating, comment]
    );
    
    res.status(201).json({
      message: 'Product review submitted successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting product review:', error);
    res.status(500).json({ error: 'Server error while submitting product review' });
  }
}; 